import {helpers, type ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import type {Session} from 'react-router'
import {createCookieSessionStorage} from 'react-router'
import {getClientConfig, getSlasClient} from '@/app/utils/api/commerce-client'

export type SessionData = {
    accessToken?: string
    accessTokenExpiry?: number
    refreshToken?: string
    refreshTokenExpiry?: number
}

type SessionFlashData = {
    error: string
}

type ApiTokenStatus = 'new' | 'valid' | 'refreshed'

const {getSession: _getSession, commitSession: _commitSession} = createCookieSessionStorage({
    cookie: {
        name: '__session',
        httpOnly: true,
        maxAge: 60,
        path: '/',
        sameSite: 'lax',
        secrets: ['s3cret1'], // TODO: Make this an env variable!
        secure: true
    }
})
const getSession = (request: Request): Promise<Session<SessionData, SessionFlashData>> =>
    _getSession(request.headers.get('Cookie'))
const commitSession = (session: Session<SessionData, SessionFlashData>) =>
    _commitSession(session, {
        expires: new Date(session.get('refreshTokenExpiry') as number)
    })

const requestCache = new WeakMap<
    Request,
    Promise<[Session<SessionData, SessionFlashData>, typeof commitSession, ApiTokenStatus]>
>()

function updateSession(
    session: Session<SessionData, SessionFlashData>,
    {
        access_token,
        expires_in,
        refresh_token,
        refresh_token_expires_in
    }: ShopperLoginTypes.TokenResponse
): void {
    const now = Date.now()
    session.set('accessToken', access_token)
    session.set('accessTokenExpiry', now + expires_in * 1_000 * 0.95) // 95% of actual expiry time for safety
    session.set('refreshToken', refresh_token)
    session.set('refreshTokenExpiry', now + refresh_token_expires_in * 1_000 * 0.99) // 99% of actual expiry time for safety
}

export const getCommerceApiToken = async (
    request: Request
): Promise<[Session<SessionData, SessionFlashData>, typeof commitSession, ApiTokenStatus]> => {
    const cachedRequest = requestCache.get(request)
    if (cachedRequest) {
        return cachedRequest
    }

    const currentRequest = new Promise<
        [Session<SessionData, SessionFlashData>, typeof commitSession, ApiTokenStatus]
    >(async (resolve, reject) => {
        const session = await getSession(request)
        const accessToken = session.get('accessToken')
        const accessTokenExpiry = session.get('accessTokenExpiry')
        const now = Date.now()
        if (accessToken && typeof accessTokenExpiry === 'number' && accessTokenExpiry >= now) {
            // console.log('Using existing access token:', accessToken)
            return resolve([session, commitSession, 'valid'])
        }

        const slasClient = getSlasClient()
        const refreshToken = session.get('refreshToken')
        const refreshTokenExpiry = session.get('refreshTokenExpiry')
        if (refreshToken && typeof refreshTokenExpiry === 'number' && refreshTokenExpiry >= now) {
            try {
                console.log('Refreshing access token...')
                return resolve(
                    helpers
                        .refreshAccessToken(slasClient, {refreshToken})
                        .then(
                            (
                                response: ShopperLoginTypes.TokenResponse
                            ): [
                                Session<SessionData, SessionFlashData>,
                                typeof commitSession,
                                ApiTokenStatus
                            ] => {
                                console.log(
                                    'Retrieved refreshed access token:',
                                    response.access_token
                                )
                                updateSession(session, response)
                                return [session, commitSession, 'refreshed']
                            }
                        )
                )
            } catch (error) {
                session.flash('error', 'Retrieving refreshed access token failed')
                console.error('Error retrieving refreshed access token:', error)
                reject(error)
            }
        }

        // Otherwise, get a new token
        try {
            console.log('Retrieving new access token...')
            const {redirectURI} = getClientConfig()
            return resolve(
                helpers
                    .loginGuestUser(slasClient, {
                        redirectURI
                    })
                    .then(
                        (
                            response: ShopperLoginTypes.TokenResponse
                        ): [
                            Session<SessionData, SessionFlashData>,
                            typeof commitSession,
                            ApiTokenStatus
                        ] => {
                            console.log('Retrieved new access token:', response.access_token)
                            updateSession(session, response)
                            return [session, commitSession, 'new']
                        }
                    )
            )
        } catch (error) {
            session.flash('error', 'Retrieving new access token failed')
            console.error('Error retrieving new access token:', error)
            reject(error)
        }
    }).finally(() => {
        requestCache.delete(request)
    })
    requestCache.set(request, currentRequest)
    return currentRequest
}
