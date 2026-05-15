/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    helpers,
    ShopperLogin,
    ShopperCustomers,
    ShopperLoginTypes,
    ShopperCustomersTypes,
    FetchOptions
} from 'commerce-sdk-isomorphic'
import {jwtDecode, JwtPayload} from 'jwt-decode'
import {ApiClientConfigParams, Prettify, RemoveStringIndex} from '../hooks/types'
import {BaseStorage, LocalStorage, CookieStorage, MemoryStorage, StorageType} from './storage'
import {CustomerType} from '../hooks/useCustomerType'
import {
    getParentOrigin,
    isOriginTrusted,
    onClient,
    getDefaultCookieAttributes,
    stringToBase64,
    extractCustomParameters
} from '../utils'
import {
    SLAS_SECRET_WARNING_MSG,
    SLAS_SECRET_PLACEHOLDER,
    SLAS_SECRET_OVERRIDE_MSG,
    DNT_COOKIE_NAME,
    DWSID_COOKIE_NAME,
    SLAS_REFRESH_TOKEN_COOKIE_TTL_OVERRIDE_MSG,
    X_GRANT_TYPE
} from '../constant'

import {Logger} from '../types'

type TokenResponse = ShopperLoginTypes.TokenResponse
type TrustedAgentTokenRequest = ShopperLoginTypes.getTrustedAgentAccessTokenBodyType
type Helpers = typeof helpers
interface AuthConfig extends ApiClientConfigParams {
    redirectURI: string
    proxy: string
    headers?: Record<string, string>
    privateClientProxyEndpoint?: string
    publicClientProxyEndpoint?: string
    fetchOptions?: FetchOptions
    fetchedToken?: string
    enablePWAKitPrivateClient?: boolean
    clientSecret?: string
    silenceWarnings?: boolean
    logger: Logger
    defaultDnt?: boolean
    passwordlessLoginCallbackURI?: string
    refreshTokenRegisteredCookieTTL?: number
    refreshTokenGuestCookieTTL?: number
    hybridAuthEnabled?: boolean
    cookieDomain?: string
    /** When true, session tokens are set as HttpOnly cookies */
    enableHttpOnlySessionCookies?: boolean
}

interface JWTHeaders {
    exp: number
    iat: number
}

interface SlasJwtPayload extends JwtPayload {
    sub: string
    isb: string
    dnt: string
}

type LoginRegisteredUserB2CCredentials = Parameters<Helpers['loginRegisteredUserB2C']>[0]

/**
 * Body type for loginRegisteredUserB2C - aligns with register function pattern
 */
type LoginRegisteredUserB2CBody = {
    username: string
    password: string
    customParameters?: helpers.CustomRequestBody
}

type LoginIDPUserParams = {
    redirectURI?: string
    code: string
    usid?: string
}

type AuthorizeIDPParams = {
    redirectURI: string
    hint: string
    usid?: string
    [key: string]: any // Allow custom parameters
}

type AuthorizePasswordlessParams = {
    callbackURI?: string
    userid: string
    mode?: 'email' | 'callback'
    locale?: string
    /** When true, SLAS will register the customer as part of the passwordless flow */
    register_customer?: boolean | string
    /** Optional registration details forwarded to SLAS when register_customer=true */
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
}

type GetPasswordLessAccessTokenParams = {
    pwdlessLoginToken: string
    /** When true, SLAS will register the customer if not already registered */
    register_customer?: boolean | string
}

/**
 * The extended field is not from api response, we manually store the auth type,
 * so we don't need to make another API call when we already have the data.
 * Plus, the getCustomer endpoint only works for registered user, it returns a 404 for a guest user,
 * and it's not easy to grab this info in user land, so we add it into the Auth object, and expose it via a hook
 */
export type AuthData = Prettify<
    RemoveStringIndex<TokenResponse> & {
        customer_type: CustomerType
        idp_access_token: string
    }
>

/** A shopper could be guest or registered, so we store the refresh tokens individually. */
type AuthDataKeys =
    | Exclude<keyof AuthData, 'refresh_token'>
    | 'refresh_token_guest'
    | 'refresh_token_registered'
    | 'access_token_sfra'
    | typeof DNT_COOKIE_NAME
    | typeof DWSID_COOKIE_NAME
    | 'code_verifier'
    | 'uido'
    | 'idp_refresh_token'
    | 'dnt'
    | 'cc-at-expires'
    | 'cc-at-dnt'
    | 'cc-nx-expires'

type AuthDataMap = Record<
    AuthDataKeys,
    {
        storageType: StorageType
        key: string
        callback?: (storage: BaseStorage) => void
    }
>
type DntOptions = {
    includeDefaults: boolean
}

const isParentTrusted = isOriginTrusted(getParentOrigin())

/**
 * A map of the data that this auth module stores. This maps the name of the property to
 * the storage type and the key when stored in that storage. You can also pass in a "callback"
 * function to do extra operation after a property is set.
 */
const DATA_MAP: AuthDataMap = {
    access_token: {
        storageType: 'local',
        key: 'access_token'
    },
    customer_id: {
        storageType: 'local',
        key: 'customer_id'
    },
    usid: {
        storageType: 'cookie',
        key: 'usid'
    },
    enc_user_id: {
        storageType: 'local',
        key: 'enc_user_id'
    },
    expires_in: {
        storageType: 'local',
        key: 'expires_in'
    },
    id_token: {
        storageType: 'local',
        key: 'id_token'
    },
    idp_access_token: {
        storageType: 'local',
        key: 'idp_access_token'
    },
    idp_refresh_token: {
        storageType: 'local',
        key: 'idp_refresh_token'
    },
    dnt: {
        storageType: 'local',
        key: 'dnt'
    },
    token_type: {
        storageType: 'local',
        key: 'token_type'
    },
    refresh_token_guest: {
        storageType: 'cookie',
        key: isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-iframe' : 'cc-nx')
        }
    },
    refresh_token_registered: {
        storageType: 'cookie',
        key: isParentTrusted ? 'cc-nx-iframe' : 'cc-nx',
        callback: (store) => {
            store.delete(isParentTrusted ? 'cc-nx-g-iframe' : 'cc-nx-g')
        }
    },
    refresh_token_expires_in: {
        storageType: 'local',
        key: 'refresh_token_expires_in'
    },
    customer_type: {
        storageType: 'local',
        key: 'customer_type'
    },
    /*
     * For Hybrid setups, we need a mechanism to inform PWA Kit whenever customer login state changes on SFRA.
     * We do this by having SFRA store the access token in cookies. If these cookies are present, PWA
     * compares the access token from the cookie with the one in local store. If the tokens are different,
     * discard the access token in local store and replace it with the access token from the cookie.
     *
     * ECOM has a 1200 character limit on the values of cookies. The access token easily exceeds this amount
     * so it sends the access token in chunks across several cookies.
     *
     * The JWT tends to come in at around 2250 characters so there's usually
     * both a cc-at and cc-at_2.
     */
    access_token_sfra: {
        storageType: 'cookie',
        key: 'cc-at'
    },
    [DNT_COOKIE_NAME]: {
        storageType: 'cookie',
        key: DNT_COOKIE_NAME
    },
    dwsid: {
        storageType: 'cookie',
        key: DWSID_COOKIE_NAME
    },
    code_verifier: {
        storageType: 'local',
        key: 'code_verifier'
    },
    uido: {
        storageType: 'local',
        key: 'uido'
    },
    'cc-at-expires': {
        storageType: 'cookie',
        key: 'cc-at-expires'
    },
    'cc-at-dnt': {
        storageType: 'cookie',
        key: 'cc-at-dnt'
    },
    'cc-nx-expires': {
        storageType: 'cookie',
        key: 'cc-nx-expires'
    }
}

export const DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL = 90 * 24 * 60 * 60
export const DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL = 30 * 24 * 60 * 60

/**
 * Auth-data keys whose storage is backed by a proxy-set cookie when
 * `enableHttpOnlySessionCookies` is on. In that mode reads and writes for
 * these keys go to the cookie store instead of localStorage, with the cookie
 * as the single source of truth.
 *
 * Some entries here (`idp_access_token`, `idp_refresh_token`) are HttpOnly
 * and unreadable from JavaScript — they're included for routing symmetry so
 * the storage type is consistent in httpOnly mode; reads of those keys
 * return '' from the cookie store either way.
 *
 * `expires_in` is intentionally absent: the access token expiry is already
 * covered by the `cc-at-expires` cookie, so we derive it from there in the
 * `data` getter instead of backing a redundant cookie.
 *
 * @internal
 */
const HTTPONLY_COOKIE_BACKED_KEYS: ReadonlySet<AuthDataKeys> = new Set([
    'customer_id',
    'enc_user_id',
    'customer_type',
    'id_token',
    'idp_access_token',
    'idp_refresh_token',
    'uido'
])

/**
 * Module-level map for deduplicating concurrent refresh token requests across Auth instances.
 * React may recreate Auth instances on re-renders (due to unstable useMemo deps like `headers`),
 * so instance-level dedup via `this.pendingToken` is insufficient. This map ensures only one
 * in-flight refresh request exists per siteId+clientId combination.
 * @internal — exported for test access only
 */
export const pendingRefreshTokens = new Map<string, Promise<AuthData>>()

/**
 * This class is used to handle shopper authentication.
 * It is responsible for initializing shopper session, manage access
 * and refresh tokens on server/browser environments. As well as providing
 * a mechanism to queue network calls before having a valid access token.
 *
 * @Internal
 */
class Auth {
    private client: ShopperLogin<ApiClientConfigParams>
    private shopperCustomersClient: ShopperCustomers<ApiClientConfigParams>
    private redirectURI: string
    private stores: Record<StorageType, BaseStorage>
    private fetchedToken: string
    private clientSecret: string
    private silenceWarnings: boolean
    private logger: Logger
    private defaultDnt: boolean | undefined
    private isPrivate: boolean
    private passwordlessLoginCallbackURI: string
    private refreshTokenRegisteredCookieTTL: number | undefined
    private refreshTokenGuestCookieTTL: number | undefined
    private refreshTrustedAgentHandler:
        | ((loginId: string, usid: string, refresh: boolean) => Promise<TokenResponse>)
        | undefined

    private hybridAuthEnabled: boolean
    private enableHttpOnlySessionCookies: boolean

    constructor(config: AuthConfig) {
        // Special proxy endpoint for injecting SLAS private client secret.
        // We prioritize config.privateClientProxyEndpoint since that allows us to use the new envBasePath feature
        this.client = new ShopperLogin({
            proxy: config.enablePWAKitPrivateClient
                ? config.privateClientProxyEndpoint
                : config.enableHttpOnlySessionCookies
                ? config.publicClientProxyEndpoint
                : config.proxy,
            headers: config.headers || {},
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId
            },
            throwOnBadResponse: true,
            // We need to set credentials to 'same-origin' to allow cookies to be set.
            // This is required as SLAS calls return a dwsid cookie for hybrid sites.
            // The dwsid value is then passed to the SCAPI as a header maintain the server affinity.
            fetchOptions: {
                credentials: 'same-origin',
                ...config.fetchOptions
            }
        })
        this.shopperCustomersClient = new ShopperCustomers({
            proxy: config.proxy,
            headers: config.headers || {},
            parameters: {
                clientId: config.clientId,
                organizationId: config.organizationId,
                shortCode: config.shortCode,
                siteId: config.siteId
            },
            throwOnBadResponse: true,
            fetchOptions: config.fetchOptions
        })

        const baseOptions = {keySuffix: config.siteId}
        // Setting sharedContext to true on the server allows us to reuse guest auth tokens across lambda runs
        const memoryOptions = {...baseOptions, sharedContext: !onClient()}
        const cookieOptions = {...baseOptions, cookieDomain: config.cookieDomain}

        this.stores = {
            cookie: onClient()
                ? new CookieStorage(cookieOptions)
                : new MemoryStorage(memoryOptions),
            local: onClient() ? new LocalStorage(baseOptions) : new MemoryStorage(memoryOptions),
            memory: new MemoryStorage(memoryOptions)
        }

        this.redirectURI = config.redirectURI

        this.fetchedToken = config.fetchedToken || ''

        this.logger = config.logger

        this.defaultDnt = config.defaultDnt

        this.refreshTokenRegisteredCookieTTL = config.refreshTokenRegisteredCookieTTL

        this.refreshTokenGuestCookieTTL = config.refreshTokenGuestCookieTTL

        /*
         * There are 2 ways to enable SLAS private client mode.
         * If enablePWAKitPrivateClient=true, we route SLAS calls to /mobify/slas/private
         * and set an internal placeholder as the client secret. The proxy will override the placeholder
         * with the actual client secret so any truthy value as the placeholder works here.
         *
         * If enablePWAKitPrivateClient=false and clientSecret is provided as a non-empty string,
         * private client mode is enabled but we don't route calls to /mobify/slas/private
         * This is how non-PWA Kit consumers of commerce-sdk-react can enable private client and set a secret
         *
         * If both enablePWAKitPrivateClient and clientSecret are truthy, enablePWAKitPrivateClient takes
         * priority and we ignore whatever was set for clientSecret. This prints a warning about the clientSecret
         * being ignored.
         *
         * If both enablePWAKitPrivateClient and clientSecret are falsy, we are in SLAS public client mode.
         */
        if (config.enablePWAKitPrivateClient && config.clientSecret) {
            this.logWarning(SLAS_SECRET_OVERRIDE_MSG)
        }
        this.clientSecret = config.enablePWAKitPrivateClient
            ? // PWA proxy is enabled, assume project is PWA and that the proxy will handle setting the secret
              // We can pass any truthy value here to satisfy commerce-sdk-isomorphic requirements
              SLAS_SECRET_PLACEHOLDER
            : // We think there are users of Commerce SDK React and Commerce SDK isomorphic outside of PWA
              // For these users to use a private client, they must have some way to set a client secret
              // PWA users should not need to touch this.
              config.clientSecret || ''

        this.silenceWarnings = config.silenceWarnings || false

        this.isPrivate = !!this.clientSecret

        this.passwordlessLoginCallbackURI = config.passwordlessLoginCallbackURI || ''

        this.hybridAuthEnabled = config.hybridAuthEnabled || false
        this.enableHttpOnlySessionCookies = config.enableHttpOnlySessionCookies ?? false
    }

    /**
     * Returns the storage type to use for a given key. When
     * `enableHttpOnlySessionCookies` is on (and we're on the client), the SLAS
     * proxy writes cookies for the metadata keys in
     * `HTTPONLY_COOKIE_BACKED_KEYS`, so reads/writes for those keys are
     * routed to the cookie store instead of local storage.
     */
    private resolveStorageType(name: AuthDataKeys): StorageType {
        const {storageType} = DATA_MAP[name]
        if (
            this.enableHttpOnlySessionCookies &&
            onClient() &&
            HTTPONLY_COOKIE_BACKED_KEYS.has(name)
        ) {
            return 'cookie'
        }
        return storageType
    }

    get(name: AuthDataKeys) {
        const {key} = DATA_MAP[name]
        const storage = this.stores[this.resolveStorageType(name)]
        return storage.get(key)
    }

    private set(name: AuthDataKeys, value: string, options?: unknown) {
        const {key} = DATA_MAP[name]
        const storage = this.stores[this.resolveStorageType(name)]
        storage.set(key, value, options)
        DATA_MAP[name].callback?.(storage)
    }

    private delete(name: AuthDataKeys) {
        const {key} = DATA_MAP[name]
        const storage = this.stores[this.resolveStorageType(name)]
        storage.delete(key)
    }

    /**
     * Returns the DNT value from the current access token, or undefined if
     * no access token is available. In HttpOnly mode, reads from the
     * cc-at-dnt companion cookie; otherwise parses the JWT directly.
     */
    private getDntFromAccessToken(): string | undefined {
        if (this.enableHttpOnlySessionCookies && onClient()) {
            return this.get('cc-at-dnt') || undefined
        }
        const accessToken = this.getAccessToken()
        if (accessToken) {
            return this.parseSlasJWT(accessToken).dnt
        }
        return undefined
    }

    /**
     * Return the value of the DNT cookie or undefined if it is not set.
     * The DNT cookie being undefined means that there is a necessity to
     * get the user's input for consent tracking, but not that there is no
     * DNT value to apply to analytics layers. DNT value will default to
     * a certain value and this is reflected by effectiveDnt.
     *
     * If the cookie value is invalid, then it will be deleted in this function.
     *
     * If includeDefaults is true, then even if the cookie is not defined,
     * defaultDnt will be returned, if it exists. If defaultDnt is not defined, then
     * the SDK Default will return (false)
     */
    getDnt(options?: DntOptions) {
        const dntCookieVal = this.get(DNT_COOKIE_NAME)
        let dntCookieStatus = undefined

        const accessTokenDnt = this.getDntFromAccessToken()
        const isInSync = accessTokenDnt === undefined || accessTokenDnt === dntCookieVal
        if ((dntCookieVal !== '1' && dntCookieVal !== '0') || !isInSync) {
            this.delete(DNT_COOKIE_NAME)
        } else {
            dntCookieStatus = Boolean(Number(dntCookieVal))
        }

        if (options?.includeDefaults) {
            const defaultDnt = this.defaultDnt

            let effectiveDnt
            const dntCookie = dntCookieVal === '1' ? true : dntCookieVal === '0' ? false : undefined
            if (dntCookie !== undefined) {
                effectiveDnt = dntCookie
            } else {
                // If the cookie is not set, read the defaultDnt preference.
                // If defaultDnt doesn't exist, default to false, following SLAS default for dnt
                effectiveDnt = defaultDnt !== undefined ? defaultDnt : false
            }

            return effectiveDnt
        }

        return dntCookieStatus
    }

    async setDnt(preference: boolean | null) {
        let dntCookieVal = String(Number(preference))
        // Use defaultDNT if defined. If not, use SLAS default DNT
        if (preference === null) {
            dntCookieVal = this.defaultDnt ? String(Number(this.defaultDnt)) : '0'
        }
        // Set the cookie once to include dnt in the access token and then again to set the expiry time
        this.set(DNT_COOKIE_NAME, dntCookieVal, {
            ...getDefaultCookieAttributes(),
            secure: true
        })
        const accessTokenDnt = this.getDntFromAccessToken()
        if (accessTokenDnt === undefined || accessTokenDnt !== dntCookieVal) {
            await this.refreshAccessToken()
        }
        if (preference !== null) {
            // Tie the DNT cookie's expiry to the refresh token's. In httpOnly
            // mode the proxy publishes the absolute expiry as `cc-nx-expires`
            // (epoch seconds), which we pass straight to js-cookie as a Date.
            // In non-httpOnly mode we fall back to the localStorage TTL.
            const SECONDS_IN_DAY = 86400
            const useCookieExpiry = this.enableHttpOnlySessionCookies && onClient()
            const expires = useCookieExpiry
                ? new Date(Number(this.get('cc-nx-expires')) * 1000)
                : Number(this.get('refresh_token_expires_in')) / SECONDS_IN_DAY
            this.set(DNT_COOKIE_NAME, dntCookieVal, {
                ...getDefaultCookieAttributes(),
                secure: true,
                expires
            })
        }
    }

    private clearStorage() {
        // Type assertion because Object.keys is silly and limited :(
        const keys = Object.keys(DATA_MAP) as AuthDataKeys[]
        keys.forEach((keyName) => {
            const {key} = DATA_MAP[keyName]
            const store = this.stores[this.resolveStorageType(keyName)]
            store.delete(key)
        })
    }

    /**
     * Every method in this class that returns a `TokenResponse` constructs it via this getter.
     */
    private get data(): AuthData {
        return {
            access_token: this.get('access_token'),
            customer_id: this.get('customer_id'),
            enc_user_id: this.get('enc_user_id'),
            expires_in: this.getExpiresIn(),
            id_token: this.get('id_token'),
            idp_access_token: this.get('idp_access_token'),
            refresh_token: this.get('refresh_token_registered') || this.get('refresh_token_guest'),
            token_type: this.get('token_type') as 'Bearer',
            usid: this.get('usid'),
            customer_type: this.get('customer_type') as CustomerType,
            refresh_token_expires_in: Number(this.get('refresh_token_expires_in'))
        }
    }

    /**
     * Returns the access token's remaining lifetime in seconds. In httpOnly mode
     * we derive it from the `cc-at-expires` cookie (the access-token JWT `exp`
     * claim, in epoch seconds) instead of storing a redundant `expires_in`
     * cookie. Falls back to the local-storage value otherwise.
     */
    private getExpiresIn(): number {
        if (this.enableHttpOnlySessionCookies && onClient()) {
            const expiresAt = this.get('cc-at-expires')
            if (!expiresAt) return NaN
            const expiresAtSec = Number(expiresAt)
            if (Number.isNaN(expiresAtSec)) return NaN
            return Math.max(0, Math.floor(expiresAtSec - Date.now() / 1000))
        }
        return parseInt(this.get('expires_in'))
    }

    /**
     * Used to validate JWT token expiration.
     */
    private isTokenExpired(token: string) {
        const {exp, iat} = jwtDecode<JWTHeaders>(token.replace('Bearer ', ''))
        const validTimeSeconds = exp - iat - 60
        const tokenAgeSeconds = Date.now() / 1000 - iat
        return validTimeSeconds <= tokenAgeSeconds
    }

    /**
     * Returns whether a refresh token exists in an HttpOnly cookie. Since JavaScript
     * cannot read HttpOnly cookies, we check `cc-nx-expires` — a non-HttpOnly cookie
     * the proxy sets with the same expiry as the refresh token. A non-empty read
     * means the browser hasn't yet evicted the cookie, so the refresh token is
     * still alive.
     */
    private hasHttpOnlyRefreshToken(): boolean {
        return this.enableHttpOnlySessionCookies && onClient() && Boolean(this.get('cc-nx-expires'))
    }

    /**
     * Clears the non-HttpOnly access token expiry cookie (cc-at-expires).
     *
     * This is needed when SCAPI returns a 401 because the HttpOnly access token cookie
     * (cc-at_{siteId}) was deleted externally while the expiry cookie remained valid.
     * Clearing the expiry cookie ensures isAccessTokenExpired() returns true, so
     * subsequent calls to ready() will trigger a refresh instead of assuming the token
     * is still valid.
     */
    clearAccessTokenExpiry(): void {
        this.delete('cc-at-expires')
    }

    /**
     * Returns whether the access token is expired. When enableHttpOnlySessionCookies is true,
     * uses cc-at-expires cookie from store; otherwise decodes the JWT from getAccessToken().
     */
    private isAccessTokenExpired(): boolean {
        if (this.enableHttpOnlySessionCookies && onClient()) {
            const expiresAt = this.get('cc-at-expires')
            if (expiresAt == null || expiresAt === '') return true
            const expiresAtSec = Number(expiresAt)
            if (Number.isNaN(expiresAtSec)) return true
            const bufferSeconds = 60
            return Date.now() / 1000 >= expiresAtSec - bufferSeconds
        }
        // Server (SSR) or httpOnly disabled: decode JWT from stored token
        const token = this.getAccessToken()
        return !token || this.isTokenExpired(token)
    }

    /**
     * Returns the SLAS access token or an empty string if the access token
     * is not found in local store or if SFRA wants PWA to trigger refresh token login.
     *
     * On PWA-only sites, this returns the access token from local storage.
     * On Hybrid sites, this checks whether SFRA has sent an auth token via cookies.
     * Returns an access token from SFRA if it exist.
     * If not, the access token from local store is returned.
     *
     * This is only used within this Auth module since other modules consider the access
     * token from this.get('access_token') to be the source of truth.
     *
     * @returns {string} access token
     */
    private getAccessToken() {
        // In httpOnly mode on the client, the access token lives in an HttpOnly
        // cookie that JS can't read, and the SFRA cc-at handoff isn't used in
        // this mode (eCOM owns the session cookies directly). Return an empty
        // string — callers that try to decode it (e.g., the TAOB flow in
        // `_refreshAccessToken`) already handle the invalid-JWT case and fall
        // through to a refresh / guest login.
        if (this.enableHttpOnlySessionCookies && onClient()) {
            return ''
        }

        let accessToken = this.get('access_token')
        const sfraAuthToken = this.get('access_token_sfra')

        // This code block only executes in plugin_slas hybrid setup when the cc-at cookie is set.
        if (sfraAuthToken) {
            /*
             * If SFRA sends 'refresh', we return an empty token here so PWA can trigger a login refresh
             * This key is used when logout is triggered in SFRA but the redirect after logout
             * sends the user to PWA.
             */
            if (sfraAuthToken === 'refresh') {
                this.set('access_token', '')
                this.clearSFRAAuthToken()
                return ''
            }
            const {isGuest, customerId, usid} = this.parseSlasJWT(sfraAuthToken)

            /**
             * This if block is only executed in a hybrid setup when the cc-at cookie is set.
             * If the login state of the shopper changes on SFRA, the "refresh_token_expires_in"
             * will change and the updated value is not propagated back to PWA Kit via cookies or cc-at token.
             * This results in the "refresh_token_expires_in" to be incorrect so we can't read it from localStorage.
             * We must instead read the login state by decoding the cc-at token and rely on the default values for the guest or registered user.
             * This in worst cases will cause the usid cookie to expire a few hours after the refreshToken which should be acceptable given
             * a few hours are insignificant compared tothe overall validty of the refreshToken.
             */
            const refreshTokenExpiresIn = isGuest
                ? DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
                : DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL
            const refreshTokenTTLValue = this.getRefreshTokenCookieTTLValue(
                refreshTokenExpiresIn,
                isGuest
            )
            const expiresDate = this.convertSecondsToDate(refreshTokenTTLValue)
            this.set('access_token', sfraAuthToken)
            this.set('customer_id', customerId)

            /**
             * The usid cookie always set when session bridging in a hybrid setup. This makes resetting the usid
             * cookie here redundant. However, if the usid cookie is not set, we can have a fallback to read the usid from the accesstoken and set it.
             * Setting the usid cookie conditionally ensures the usid is always set and minimizes the discrepancy between usid cookie and refresh_token cookie expiration.
             */
            const usidCookieValue = this.get('usid')
            if (!usidCookieValue || usidCookieValue !== usid) {
                this.set('usid', usid, {
                    expires: expiresDate
                })
            }

            this.set('customer_type', isGuest ? 'guest' : 'registered')

            accessToken = sfraAuthToken
            // SFRA -> PWA access token cookie handoff is successful so we clear the SFRA made cookies.
            // We don't want these cookies to persist and continue overriding what is in local store.
            this.clearSFRAAuthToken()
        }

        return accessToken
    }

    /**
     * For Hybrid storefronts ONLY!!!
     * This method clears out SLAS access token generated in Plugin SLAS and passed in via "cc-at" cookie.
     *
     * In a hybrid setup, whenever any SLAS flow executes in Plugin SLAS and an access token is generated,
     * the access token is sent over to PWA Kit using cc-at cookie.
     *
     * PWA Kit will check to see if cc-at cookie exists, if it does, the access token value in localStorage is updated
     * with value from the cc-at cookie and is then used for all SCAPI requests made from PWA Kit. The cc-at cookie is then cleared.
     */
    private clearSFRAAuthToken() {
        const {key, storageType} = DATA_MAP['access_token_sfra']
        const store = this.stores[storageType]
        store.delete(key)
    }

    /**
     * For Hybrid storefronts ONLY!!!
     * This method clears the dwsid cookie from the browser.
     * In a hybrid setup, dwsid points to an ECOM session and is passed between PWA Kit and SFRA/SG sites via "dwsid" cookie.
     *
     * Whenever a registered shopper logs in on PWA Kit, we must clear the dwsid cookie if one exists. When shopper navigates
     * to SFRA as a logged-in shopper, ECOM notices a missing DWSID, generates a new DWSID and triggers the onSession hook which uses
     * registered shopper refresh-token and restores session and basket on SFRA.
     */
    private clearECOMSession() {
        /**
         * If `hybridAuthEnabled` is true, dwsid cookie must not be cleared.
         * This makes sure the session-bridged dwsid, received from `/oauth2/token` call on shopper login
         * is NOT cleared and can be used to maintain the server affinity.
         */
        if (this.hybridAuthEnabled) {
            return
        }
        const {key, storageType} = DATA_MAP[DWSID_COOKIE_NAME]
        const store = this.stores[storageType]
        store.delete(key)
    }

    /**
     * Converts a duration in seconds to a Date object.
     * This function takes a number representing seconds and returns a Date object
     * for the current time plus the given duration.
     *
     * @param {number} seconds - The number of seconds to add to the current time.
     * @returns {Date} A Date object for the expiration time.
     */
    private convertSecondsToDate(seconds: number): Date {
        if (typeof seconds !== 'number') {
            throw new Error('The refresh_token_expires_in seconds parameter must be a number.')
        }
        return new Date(Date.now() + seconds * 1000)
    }

    /**
     * Retrieves our refresh token cookie ttl value from the following sources in order:
     * 1. Override value (if set)
     * 2. SLAS response value (if set)
     * 3. Default value (if no override or SLAS response value is set)
     */
    private getRefreshTokenCookieTTLValue(
        refreshTokenExpiresInSLASValue: number | undefined,
        isGuest: boolean
    ): number {
        const overrideValue = isGuest
            ? this.refreshTokenGuestCookieTTL
            : this.refreshTokenRegisteredCookieTTL
        const defaultValue = isGuest
            ? DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
            : DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL
        // Check if overrideValue is valid
        // if not, log warning and fall back to responseValue or defaultValue
        const isOverrideValid =
            typeof overrideValue === 'number' && overrideValue > 0 && overrideValue <= defaultValue
        if (!isOverrideValid && overrideValue !== undefined) {
            this.logWarning(SLAS_REFRESH_TOKEN_COOKIE_TTL_OVERRIDE_MSG)
        }

        // Return the first valid value: overrideValue (if valid), responseValue, or defaultValue
        return isOverrideValid ? overrideValue : refreshTokenExpiresInSLASValue || defaultValue
    }

    /**
     * This method stores the TokenResponse object retrieved from SLAS, and
     * store the data in storage.
     */
    private handleTokenResponse(res: TokenResponse, isGuest: boolean) {
        // In httpOnly mode on the client, every value we'd otherwise persist
        // here is already set as a cookie by the SLAS proxy / eCOM (access
        // token, refresh token, customer_id, customer_type, usid, uido,
        // id_token, enc_user_id, etc.). There is nothing left for the client
        // to write, so short-circuit. SSR and non-httpOnly mode still need to
        // populate the in-memory / localStorage stores so subsequent reads
        // work, so the rest of the function continues for those cases.
        if (this.enableHttpOnlySessionCookies && onClient()) {
            return
        }

        // Delete the SFRA auth token cookie if it exists
        this.clearSFRAAuthToken()

        this.set('customer_id', res.customer_id)
        this.set('enc_user_id', res.enc_user_id)
        this.set('expires_in', `${res.expires_in}`)
        this.set('id_token', res.id_token)
        this.set('customer_type', isGuest ? 'guest' : 'registered')
        this.set('token_type', res.token_type)

        const refreshTokenTTLValue = this.getRefreshTokenCookieTTLValue(
            res.refresh_token_expires_in,
            isGuest
        )
        this.set('refresh_token_expires_in', refreshTokenTTLValue.toString())
        const expiresDate = this.convertSecondsToDate(refreshTokenTTLValue)
        this.set('usid', res.usid ?? '', {expires: expiresDate})

        this.set('access_token', res.access_token)
        this.set('idp_access_token', res.idp_access_token)
        if (res.access_token) {
            const {uido} = this.parseSlasJWT(res.access_token)
            this.set('uido', uido)
        }
        const refreshTokenKey = isGuest ? 'refresh_token_guest' : 'refresh_token_registered'
        this.set(refreshTokenKey, res.refresh_token, {expires: expiresDate})
    }

    private get refreshDedupKey(): string {
        const params = this.client.clientConfig.parameters
        return `refresh:${params.siteId}:${params.clientId}`
    }

    async refreshAccessToken() {
        // Dedup uses a module-level map (not an instance field) because React may recreate
        // the Auth instance on re-renders, giving each instance its own state. The map is
        // keyed by siteId+clientId so different sites/clients remain independent.
        // On the server (SSR), each request is isolated — skip dedup entirely.
        if (!onClient()) {
            return await this._refreshAccessToken()
        }

        const key = this.refreshDedupKey
        const existing = pendingRefreshTokens.get(key)
        if (existing) {
            await existing
            return this.data
        }

        const promise = this._refreshAccessToken().finally(() => {
            pendingRefreshTokens.delete(key)
        })
        pendingRefreshTokens.set(key, promise)
        return await promise
    }

    /**
     * Internal implementation of the refresh flow. Called only via refreshAccessToken()
     * which wraps it in the module-level pendingRefreshTokens map for deduplication.
     */
    private async _refreshAccessToken() {
        const dntPref = this.getDnt({includeDefaults: true})
        const refreshTokenRegistered = this.get('refresh_token_registered')
        const refreshTokenGuest = this.get('refresh_token_guest')
        const refreshToken = refreshTokenRegistered || refreshTokenGuest

        // When HttpOnly session cookies are enabled on the client, the refresh token is in an
        // HttpOnly cookie that JavaScript cannot read. We check the non-HttpOnly `cc-nx-expires`
        // cookie (set with the same expiry as the refresh token) to avoid a wasted round-trip
        // when the refresh token is absent. If `cc-nx-expires` is also missing (e.g. cleared by
        // the user), the proxy layer will catch the missing refresh token and return a 401,
        // falling through to guest login.
        if (refreshToken || (!refreshToken && this.hasHttpOnlyRefreshToken())) {
            try {
                const isGuest = this.get('customer_type') !== 'registered'
                // Signal the proxy that this is a refresh token request so it can
                // inject the HttpOnly refresh token cookie as the sfdc_refresh_token header.
                if (this.enableHttpOnlySessionCookies) {
                    this.client.clientConfig.headers[X_GRANT_TYPE] = 'refresh_token'
                }
                const token = await helpers.refreshAccessToken({
                    slasClient: this.client,
                    parameters: {
                        refreshToken: refreshToken || '',
                        dnt: dntPref
                    },
                    credentials: {
                        clientSecret: this.clientSecret
                    },
                    enableHttpOnlySessionCookies: this.enableHttpOnlySessionCookies
                })
                this.handleTokenResponse(token, isGuest)
                return this.data
            } catch (error) {
                // If the refresh token is invalid, we need to re-login the user.
                if (error instanceof Error && 'response' in error) {
                    // commerce-sdk-isomorphic throws a `ResponseError`, but doesn't export the class.
                    // We can't use `instanceof`, so instead we just check for the `response` property
                    // and assume it is a fetch Response.
                    const json = await (error['response'] as Response).json()
                    if (json.message === 'invalid refresh_token') {
                        // In a multi-tab scenario, another tab may have already consumed the
                        // one-time-use refresh token and stored fresh tokens. Re-check storage
                        // before clearing — if a valid access token exists, use it instead of
                        // wiping the other tab's work and falling back to guest login.
                        if (!this.isAccessTokenExpired()) {
                            return this.data
                        }
                        // No valid token found — clean up storage and restart the login flow.
                        this.clearStorage()
                    }
                }
            } finally {
                delete this.client.clientConfig.headers[X_GRANT_TYPE]
            }
        }

        // refresh flow for TAOB
        const accessToken = this.getAccessToken()
        if (this.isAccessTokenExpired()) {
            try {
                const {isGuest, usid, loginId, isAgent} = this.parseSlasJWT(accessToken)
                if (isAgent) {
                    const token = await this.refreshTrustedAgent(loginId, usid)
                    this.handleTokenResponse(token, isGuest)
                    return this.data
                }
            } catch (e) {
                /* catch invalid jwt */
            }
        }

        // if a TAOB left a usid and it tries to
        // use it, we will be stuck in a fail loop
        let token
        try {
            token = await this.loginGuestUser()
        } catch (e) {
            this.clearStorage()
            token = await this.loginGuestUser()
        }
        return token
    }

    logWarning = (msg: string) => {
        if (!this.silenceWarnings) {
            this.logger.warn(msg)
        }
    }

    /**
     * This method extracts the status and message from a ResponseError that is returned
     * by commerce-sdk-isomorphic.
     *
     * commerce-sdk-isomorphic throws a `ResponseError`, but doesn't export the class.
     * We can't use `instanceof`, so instead we just check for the `response` property
     * and assume it is a `ResponseError` if a response is present
     *
     * Once commerce-sdk-isomorphic exports `ResponseError` we can revisit if this method is
     * still required.
     *
     * @returns {status_code, responseMessage} contained within the ResponseError
     * @throws error if the error is not a ResponseError
     * @Internal
     */
    extractResponseError = async (error: Error) => {
        // the regular error.message will return only the generic status code message
        // ie. 'Bad Request' for 400. We need to drill specifically into the ResponseError
        // to get a more descriptive error message from SLAS
        if ('response' in error) {
            const json = await (error['response'] as Response).json()
            const status_code: string = json.status_code
            const responseMessage: string = json.message

            return {
                status_code,
                responseMessage
            }
        }
        throw error
    }

    /**
     * The ready function returns a promise that resolves with valid ShopperLogin
     * token response.
     *
     * When this method is called for the very first time, it initializes the session
     * by following the public client auth flow to get access token for the user.
     * The flow:
     * 1. If we have valid access token - use it
     * 2. If we have valid refresh token - refresh token flow
     * 3. If we have valid TAOB access token - refresh TAOB token flow
     * 4. PKCE flow
     */
    async ready() {
        // In httpOnly mode on the client, every session value is backed by a
        // cookie set by the SLAS proxy / eCOM. We never hydrate state from a
        // fetchedToken (the JWT is HttpOnly so SSR can't capture it) and we
        // don't write anything to localStorage. Just check the access token
        // expiry via `cc-at-expires` and refresh if needed; otherwise return
        // the data assembled from the proxy-set cookies.
        // `refreshAccessToken()` has its own pendingRefreshTokens dedup, so
        // we don't need the dedup check that the non-httpOnly path uses.
        if (this.enableHttpOnlySessionCookies && onClient()) {
            if (this.isAccessTokenExpired()) {
                return await this.refreshAccessToken()
            }
            return this.data
        }

        if (this.fetchedToken && this.fetchedToken !== '') {
            const {isGuest, customerId, usid} = this.parseSlasJWT(this.fetchedToken)

            // Write to localStorage in non-httpOnly mode
            this.set('access_token', this.fetchedToken)
            this.set('customer_id', customerId)
            this.set('customer_type', isGuest ? 'guest' : 'registered')

            /**
             * If the login state of the shopper changes on SFRA, the "refresh_token_expires_in"
             * will change and the updated value is not propagated back to PWA Kit via cookies or cc-at token.
             * This results in the "refresh_token_expires_in" to be incorrect so we can't read it from localStorage.
             * We must instead read the login state by decoding the cc-at token and rely on the default values for the guest or registered user.
             * This in worst cases will cause the usid cookie to expire a few hours after the refreshToken which should be acceptable given
             * a few hours are insignificant compared tothe overall validty of the refreshToken.
             */
            const refreshTokenExpiresIn = isGuest
                ? DEFAULT_SLAS_REFRESH_TOKEN_GUEST_TTL
                : DEFAULT_SLAS_REFRESH_TOKEN_REGISTERED_TTL
            const refreshTokenTTLValue = this.getRefreshTokenCookieTTLValue(
                refreshTokenExpiresIn,
                isGuest
            )

            /**
             * The usid cookie always set when setting up auth in pure composable env or session bridging in a hybrid setup. This makes resetting the usid
             * cookie here redundant. However, if the usid cookie is not set, we can have a fallback to read the usid from the accesstoken and set it.
             * Setting the usid cookie conditionally ensures the usid is always set and minimizes the discrepancy between usid cookie and refresh_token cookie expiration.
             */
            const expiresDate = this.convertSecondsToDate(refreshTokenTTLValue)
            const usidCookieValue = this.get('usid')
            if (!usidCookieValue || usidCookieValue !== usid) {
                this.set('usid', usid, {
                    expires: expiresDate
                })
            }
            return this.data
        }
        if (onClient()) {
            const pendingRefresh = pendingRefreshTokens.get(this.refreshDedupKey)
            if (pendingRefresh) {
                await pendingRefresh
                return this.data
            }
        }

        if (!this.isAccessTokenExpired()) {
            return this.data
        }

        return await this.refreshAccessToken()
    }

    /**
     * Creates a function that only executes after a session is initialized.
     * @param fn Function that needs to wait until the session is initialized.
     * @returns Wrapped function
     */
    whenReady<Args extends unknown[], Data>(
        fn: (...args: Args) => Promise<Data>
    ): (...args: Args) => Promise<Data> {
        return async (...args) => {
            await this.ready()
            return await fn(...args)
        }
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginGuestUser.
     *
     */
    async loginGuestUser(parameters?: helpers.CustomQueryParameters) {
        if (this.clientSecret && onClient() && this.clientSecret !== SLAS_SECRET_PLACEHOLDER) {
            this.logWarning(SLAS_SECRET_WARNING_MSG)
        }
        const usid = this.get('usid')
        const dntPref = this.getDnt({includeDefaults: true})
        const isGuest = true
        const guestPrivateArgs = {
            slasClient: this.client,
            parameters: {
                dnt: dntPref,
                ...(usid && {usid})
            },
            credentials: {clientSecret: this.clientSecret}
        } as const
        const guestPublicArgs = {
            slasClient: this.client,
            parameters: {
                redirectURI: this.redirectURI,
                dnt: dntPref,
                ...(usid && {usid}),
                // custom parameters are sent only into the /authorize endpoint.
                ...parameters
            }
        } as const
        const enableHttpOnlySessionCookies = this.enableHttpOnlySessionCookies
        const callback = this.clientSecret
            ? () =>
                  helpers.loginGuestUserPrivate({...guestPrivateArgs, enableHttpOnlySessionCookies})
            : () => helpers.loginGuestUser({...guestPublicArgs, enableHttpOnlySessionCookies})

        try {
            const token = await callback()
            this.handleTokenResponse(token, isGuest)
            return this.data
        } catch (error) {
            // We catch the error here to do logging but we still need to
            // throw an error to stop the login flow from continuing.
            const {status_code, responseMessage} = await this.extractResponseError(error as Error)
            this.logger.error(`${status_code} ${responseMessage}`)
            throw new Error(
                `New guest user could not be logged in. ${status_code} ${responseMessage}`
            )
        }
    }

    /**
     * This is a wrapper method for ShopperCustomer API registerCustomer endpoint.
     *
     */
    async register(body: ShopperCustomersTypes.CustomerRegistration) {
        const {customer, password, ...parameters} = body
        const {login} = customer
        const customParameters = extractCustomParameters(parameters)

        // login is optional field from isomorphic library
        // type CustomerRegistration
        // here we had to guard it to avoid ts error
        if (!login) {
            throw new Error('Customer registration is missing login field.')
        }

        // The registerCustomer endpoint currently does not support custom parameters
        // so we make sure not to send any custom params here
        const res = await this.shopperCustomersClient.registerCustomer({
            headers: {
                authorization: `Bearer ${this.get('access_token')}`
            },
            body: {
                customer,
                password
            }
        })
        await this.loginRegisteredUserB2C({
            username: login,
            password,
            customParameters
        })
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginRegisteredUserB2C.
     *
     * This method uses a body-based API similar to the register function for consistency.
     * Supports custom parameters through the customParameters field.
     */
    async loginRegisteredUserB2C(body: LoginRegisteredUserB2CBody) {
        if (this.clientSecret && onClient() && this.clientSecret !== SLAS_SECRET_PLACEHOLDER) {
            this.logWarning(SLAS_SECRET_WARNING_MSG)
        }
        const redirectURI = this.redirectURI
        const usid = this.get('usid')
        const dntPref = this.getDnt({includeDefaults: true})
        const isGuest = false

        // Extract fields from body parameter (aligned with register function pattern)
        const {username, password, customParameters} = body

        const loginParams: LoginRegisteredUserB2CCredentials = {
            slasClient: this.client,
            credentials: {
                username,
                password,
                clientSecret: this.clientSecret
            },
            parameters: {
                redirectURI,
                dnt: dntPref,
                ...(usid && {usid})
            },
            body: customParameters,
            enableHttpOnlySessionCookies: this.enableHttpOnlySessionCookies
        }

        const token = await helpers.loginRegisteredUserB2C(loginParams)
        this.handleTokenResponse(token, isGuest)
        if (onClient()) {
            void this.clearECOMSession()
        }
        return token
    }

    /**
     * Trusted agent authorization
     *
     * @warning This method is not supported on the server, it is a client-only method.
     */
    async authorizeTrustedAgent(credentials: {loginId?: string}) {
        const slasClient = this.client
        const codeVerifier = helpers.createCodeVerifier()
        const codeChallenge = await helpers.generateCodeChallenge(codeVerifier)
        const organizationId = slasClient.clientConfig.parameters.organizationId
        const clientId = slasClient.clientConfig.parameters.clientId
        const siteId = slasClient.clientConfig.parameters.siteId
        const loginId = credentials.loginId || 'guest'
        const isGuest = loginId === 'guest'
        const idpOrigin = isGuest ? 'slas' : 'ecom'

        const url = `${
            slasClient.clientConfig.proxy || ''
        }/shopper/auth/v1/organizations/${organizationId}/oauth2/trusted-agent/authorize?${[
            ...[
                `client_id=${clientId}`,
                `channel_id=${siteId}`,
                `login_id=${loginId}`,
                `redirect_uri=${this.redirectURI}`,
                `idp_origin=${idpOrigin}`,
                `response_type=code`
            ],
            ...(!this.clientSecret ? [`code_challenge=${codeChallenge}`] : [])
        ].join('&')}`

        return {url, codeVerifier}
    }

    /**
     * Trusted agent login
     *
     * @warning This method is not supported on the server, it is a client-only method.
     */
    async loginTrustedAgent(credentials: {
        loginId?: string
        code: string
        codeVerifier?: string
        usid?: string
        state?: string
        clientSecret?: string
    }) {
        const slasClient = this.client
        const loginId = credentials.loginId || 'guest'
        const isGuest = loginId === 'guest'
        const idpOrigin = isGuest ? 'slas' : 'ecom'

        const optionsToken = {
            headers: {
                Authorization: `Bearer ${credentials.code}`
            },
            body: {
                channel_id: slasClient.clientConfig.parameters.siteId,
                grant_type: 'client_credentials',
                redirect_uri: this.redirectURI,
                login_id: loginId,
                idp_origin: idpOrigin,
                dnt: 'true',
                ...(!this.clientSecret && {
                    client_id: slasClient.clientConfig.parameters.clientId,
                    code_verifier: credentials.codeVerifier
                }),
                ...(credentials.state && {state: credentials.state}),
                ...(credentials.usid && {usid: credentials.usid})
            }
        } as {headers: {[key: string]: string}; body: TrustedAgentTokenRequest}

        // using slas private client
        if (credentials.clientSecret) {
            optionsToken.headers._sfdc_client_auth = `Basic ${helpers.stringToBase64(
                `${slasClient.clientConfig.parameters.clientId}:${credentials.clientSecret}`
            )}`
        }

        const token = await slasClient.getTrustedAgentAccessToken(optionsToken)
        this.handleTokenResponse(token, isGuest)

        return token
    }
    /**
     * Trusted agent refresh handler
     *
     * @warning This method is not supported on the server, it is a client-only method.
     */
    registerTrustedAgentRefreshHandler(
        refreshTrustedAgentHandler: (
            loginId?: string,
            usid?: string,
            refresh?: boolean
        ) => Promise<TokenResponse>
    ) {
        this.refreshTrustedAgentHandler = refreshTrustedAgentHandler
    }

    async refreshTrustedAgent(loginId: string, usid: string): Promise<TokenResponse> {
        if (this.refreshTrustedAgentHandler) {
            return await this.refreshTrustedAgentHandler(loginId, usid, true)
        }

        this.clearStorage()
        return await this.loginGuestUser()
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: logout.
     *
     */
    async logout() {
        if (this.get('customer_type') === 'registered') {
            const logoutPromise = helpers.logout({
                slasClient: this.client,
                parameters: {
                    accessToken: this.get('access_token'),
                    refreshToken: this.get('refresh_token_registered')
                }
            })
            if (this.enableHttpOnlySessionCookies) {
                // When HttpOnly cookies are enabled, the proxy expires session cookies
                // on the logout response. We must await so the browser processes the
                // Set-Cookie headers before guest login sets new cookies.
                try {
                    await logoutPromise
                } catch (error) {
                    this.logger.warn(
                        `SLAS logout failed: ${
                            error instanceof Error ? error.message : String(error)
                        }. The error is ignored and session cookies are still cleared by the proxy.`
                    )
                }
            }
        }
        this.clearStorage()
        return await this.ready()
    }

    /**
     * Handle updating customer password and re-log in after the access token is invalidated.
     *
     */
    async updateCustomerPassword(body: {
        customer: ShopperCustomersTypes.Customer
        password: string
        currentPassword: string
        shouldReloginCurrentSession?: boolean
    }) {
        const {
            customer: {customerId, login},
            password,
            currentPassword,
            shouldReloginCurrentSession
        } = body

        // login and customerId are optional fields on the Customer type
        // here we had to guard it to avoid ts error
        if (!login || !customerId) {
            throw new Error('Customer is missing required fields.')
        }

        const res = await this.shopperCustomersClient.updateCustomerPassword({
            headers: {
                authorization: `Bearer ${this.get('access_token')}`
            },
            parameters: {customerId},
            body: {
                password: password,
                currentPassword: currentPassword
            }
        })

        if (shouldReloginCurrentSession) {
            await this.loginRegisteredUserB2C({
                username: login,
                password
            })
        }
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: authorizeIDP.
     * Initiates OAuth2 authorization flow for Identity Provider (IDP) login.
     *
     */
    async authorizeIDP(parameters: AuthorizeIDPParams) {
        const slasClient = this.client
        const usid = this.get('usid')
        const dntPref = this.getDnt({includeDefaults: true})

        // Extract known parameters and get custom ones
        const {redirectURI, hint, ...customParams} = parameters
        const finalRedirectURI = redirectURI || this.redirectURI

        const authorizeParams = {
            ...customParams,
            ...(usid && {usid}),
            ...(dntPref && {dnt: dntPref}),
            redirectURI: finalRedirectURI,
            hint: hint || ''
        }

        const result = await helpers.authorizeIDP({
            slasClient,
            parameters: authorizeParams,
            privateClient: this.isPrivate
        })

        // Store code verifier for later use in loginIDPUser
        this.set('code_verifier', result.codeVerifier)

        if (onClient()) {
            window.location.assign(result.url)
        } else {
            console.warn('Something went wrong, this client side method is invoked on the server.')
        }

        return result
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: loginIDPUser.
     *
     */
    async loginIDPUser(parameters: LoginIDPUserParams) {
        const codeVerifier = this.get('code_verifier')
        const redirectURI = parameters.redirectURI || this.redirectURI
        const usid = parameters.usid || this.get('usid')
        const dntPref = this.getDnt({includeDefaults: true})

        const token = await helpers.loginIDPUser({
            slasClient: this.client,
            credentials: {
                codeVerifier,
                clientSecret: this.clientSecret
            },
            parameters: {
                redirectURI,
                code: parameters.code,
                dnt: dntPref,
                ...(usid && {usid})
            },
            enableHttpOnlySessionCookies: this.enableHttpOnlySessionCookies
        })
        const isGuest = false
        this.handleTokenResponse(token, isGuest)
        // Delete the code verifier once the user has logged in
        this.delete('code_verifier')
        if (onClient()) {
            void this.clearECOMSession()
        }
        return token
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: authorizePasswordless.
     */
    async authorizePasswordless(parameters: AuthorizePasswordlessParams) {
        const usid = this.get('usid')
        // Default to 'callback' mode for backward compatibility as older versions of the template-retail-react-app
        // do not pass the mode parameter. Newer versions should explicitly pass the mode.
        const mode = parameters.mode || 'callback'
        const callbackURI = parameters.callbackURI || this.passwordlessLoginCallbackURI

        const res = await helpers.authorizePasswordless({
            slasClient: this.client,
            credentials: {
                clientSecret: this.clientSecret
            },
            parameters: {
                ...(callbackURI && {callbackURI}),
                ...(usid && {usid}),
                ...(parameters.locale && {locale: parameters.locale}),
                userid: parameters.userid,
                mode,
                ...(parameters.register_customer !== undefined && {
                    registerCustomer:
                        typeof parameters.register_customer === 'boolean'
                            ? parameters.register_customer
                            : parameters.register_customer === 'true'
                            ? true
                            : false
                }),
                ...(parameters.last_name && {lastName: parameters.last_name}),
                ...(parameters.email && {email: parameters.email}),
                ...(parameters.first_name && {firstName: parameters.first_name}),
                ...(parameters.phone_number && {phoneNumber: parameters.phone_number})
            }
        })
        if (res && res.status !== 200) {
            const errorData = await res.json()
            throw new Error(`${res.status} ${String(errorData.message)}`)
        }
        return res
    }

    /**
     * A wrapper method for commerce-sdk-isomorphic helper: getPasswordLessAccessToken.
     */
    async getPasswordLessAccessToken(parameters: GetPasswordLessAccessTokenParams) {
        const pwdlessLoginToken = parameters.pwdlessLoginToken || ''
        const dntPref = this.getDnt({includeDefaults: true})
        const usid = this.get('usid')
        const token = await helpers.getPasswordLessAccessToken({
            slasClient: this.client,
            credentials: {
                clientSecret: this.clientSecret
            },
            parameters: {
                pwdlessLoginToken,
                dnt: dntPref !== undefined ? String(dntPref) : undefined,
                ...(usid && {usid}),
                ...(parameters.register_customer !== undefined && {
                    register_customer:
                        typeof parameters.register_customer === 'boolean'
                            ? String(parameters.register_customer)
                            : parameters.register_customer
                })
            },
            enableHttpOnlySessionCookies: this.enableHttpOnlySessionCookies
        })
        const isGuest = false
        this.handleTokenResponse(token, isGuest)
        if (onClient()) {
            void this.clearECOMSession()
        }
        return token
    }

    /**
     * A wrapper method for the SLAS endpoint: getPasswordResetToken.
     *
     */
    async getPasswordResetToken(parameters: ShopperLoginTypes.getPasswordResetTokenBodyType) {
        const slasClient = this.client

        const options = {
            headers: {
                Authorization: ''
            },
            body: {
                user_id: parameters.user_id,
                mode: parameters.mode || 'callback',
                channel_id: parameters.channel_id || slasClient.clientConfig.parameters.siteId,
                client_id: parameters.client_id || slasClient.clientConfig.parameters.clientId,
                ...(parameters.callback_uri && {callback_uri: parameters.callback_uri}),
                hint: parameters.hint || 'cross_device',
                ...(parameters.locale && {locale: parameters.locale}),
                ...(parameters.idp_name && {idp_name: parameters.idp_name}),
                ...(parameters.code_challenge && {code_challenge: parameters.code_challenge})
            }
        }

        // Only set authorization header if using private client
        if (this.clientSecret) {
            options.headers.Authorization = `Basic ${stringToBase64(
                `${slasClient.clientConfig.parameters.clientId}:${this.clientSecret}`
            )}`
        }

        // Set rawResponse to true to access the response body message for error handling
        const res = await slasClient.getPasswordResetToken(options, true)
        if (res && res.status !== 200) {
            const errorData = await res.json()
            throw new Error(`${res.status} ${String(errorData.message)}`)
        }
        return res
    }

    /**
     * A wrapper method for the SLAS endpoint: resetPassword.
     *
     */
    async resetPassword(parameters: ShopperLoginTypes.resetPasswordBodyType) {
        const slasClient = this.client
        const options = {
            headers: {
                Authorization: ''
            },
            body: {
                // TODO: remove the eslint disabled after updating OAS
                // user_id is a valid param for resetPassword
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ...(parameters.user_id && {user_id: parameters.user_id}),
                pwd_action_token: parameters.pwd_action_token,
                channel_id: parameters.channel_id || slasClient.clientConfig.parameters.siteId,
                client_id: parameters.client_id || slasClient.clientConfig.parameters.clientId,
                new_password: parameters.new_password,
                hint: parameters.hint || 'cross_device',
                // hint='cross_device' and a defined user_id is required for code_verifier to be optional for this call
                ...(parameters.code_verifier && {code_verifier: parameters.code_verifier})
            }
        }

        // Only set authorization header if using private client
        if (this.clientSecret) {
            options.headers.Authorization = `Basic ${stringToBase64(
                `${slasClient.clientConfig.parameters.clientId}:${this.clientSecret}`
            )}`
        }
        const res = await this.client.resetPassword(options)
        return res
    }

    /**
     * Get the current USID for Storefront Preview by forcing a SLAS refresh.
     *
     * Works for both guest and registered shoppers: when an existing refresh
     * token is present (guest or registered, legacy or HttpOnly), the SLAS
     * response provides a fresh USID. When no refresh token is present,
     * `refreshAccessToken()` falls through to a guest login, which also yields
     * a fresh USID. Preview can therefore always obtain a USID without
     * requiring the shopper to sign in.
     */
    async getUsidForPreview(): Promise<string> {
        await this.refreshAccessToken()

        const usid = this.get('usid')
        if (!usid) {
            throw new Error('SLAS refresh did not return a USID')
        }
        return usid
    }

    /**
     * Decode SLAS JWT and extract information such as customer id, usid, etc.
     *
     */
    parseSlasJWT(jwt: string) {
        const payload: SlasJwtPayload = jwtDecode(jwt)
        const {sub, isb, dnt} = payload

        if (!sub || !isb) {
            throw new Error('Unable to parse access token payload: missing sub and isb.')
        }

        // ISB format
        // 'uido:ecom::upn:Guest||xxxEmailxxx::uidn:FirstName LastName::gcid:xxxGuestCustomerIdxxx::rcid:xxxRegisteredCustomerIdxxx::chid:xxxSiteIdxxx',
        const isbParts = isb.split('::')
        const uido = isbParts[0].split('uido:')[1]
        const isGuest = isbParts[1] === 'upn:Guest'
        const customerId = isGuest
            ? isbParts[3].replace('gcid:', '')
            : isbParts[4].replace('rcid:', '')

        const loginId = isGuest ? 'guest' : isbParts[1].replace('upn:', '')

        const isAgent = !!isbParts?.[isGuest ? 5 : 6]?.startsWith('agent:')
        const agentId = isAgent ? isbParts?.[isGuest ? 5 : 6]?.replace('agent:', '') : null

        // SUB format
        // cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-xxxx-40f88962b836::usid:b4865233-de92-4039-xxxx-aa2dfc8c1ea5
        const usid = sub.split('::')[3].replace('usid:', '')
        return {
            isGuest,
            customerId,
            usid,
            dnt,
            loginId,
            isAgent,
            agentId,
            uido
        }
    }
}

export default Auth
