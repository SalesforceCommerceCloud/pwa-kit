import React, { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { helpers, ShopperLogin } from "commerce-sdk-isomorphic";
import { onClient, getAppOrigin } from "./util";
import { isExpired } from "./jwt";
import { MemoryStorage } from "./storage";

enum AuthTypes {
  REGISTERED = "registered",
  GUEST = "guest",
}

interface State {
  isInitialized: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  authType: AuthTypes;
  customerId: string;
  accessToken: string;
  refreshToken: string;
  _config: CommerceAPIConfig;
  login: (username: string, password: string) => void;
  register: (username: string, password: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
  _initialize: () => void;
  _refreshAccessToken: () => void;
  _handleShopperLoginTokenResponse: (res: helpers.TokenResponse) => void;
}

interface CommerceAPIConfig {
  clientId: string;
  organizationId: string;
  shortCode: string;
  siteId: string;
}

interface ProviderProps extends CommerceAPIConfig {
  proxy?: string;
  debug?: boolean;
  children: React.ReactNode;
}

const ShopperContext = createContext({});
export const Provider = ({
  children,
  organizationId,
  clientId,
  shortCode,
  siteId,
  proxy,
  debug,
}: ProviderProps) => {
  // TODO: validate config value
  const config = { organizationId, clientId, siteId, shortCode };
  const shopperLoginClient = new ShopperLogin({
    proxy,
    parameters: config,
    throwOnBadResponse: true,
  });

  // we need to store the tokens on server side
  // for commerce api calls
  // TODO: test server side
  const memoryStorage = new MemoryStorage();

  const logger = (text: string | object) => {
    if (debug) {
      console.log(
        `%c(slas-react-sdk) %c${text}`,
        "font-weight:bold;",
        "color:green;"
      );
    }
  };

  const persistStorageOptions = {
    name: "slas",
    getStorage: () => {
      if (onClient()) {
        return window.localStorage;
      }
      return memoryStorage;
    },
    partialize: (state: State) => {
      // Note: unfortunately you can't rename the field here
      return {
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        customerId: state.customerId,
        authType: state.authType,
      };
    },
  };

  const store = createStore<State>()(
    persist(
      (set, get) => ({
        _config: config,
        authType: AuthTypes.GUEST,
        customerId: "",
        isInitialized: false,
        isInitializing: true,
        isAuthenticated: false,
        accessToken: "",
        refreshToken: "",
        _initialize: () => {
          logger("INIT - start");
          const self = get();
          const isAuthenticated = !!(
            self.accessToken && !isExpired(self.accessToken)
          );

          if (isAuthenticated) {
            logger("Found access token and it's not expired, done.");
            set({
              isInitializing: false,
              isInitialized: true,
              isAuthenticated,
            });
            return;
          }

          if (self.refreshToken) {
            logger("Found refresh token. Starting refresh token flow.");

            self._refreshAccessToken();
            return;
          }

          logger("No access/refresh token found. Starting guest user flow.");
          self.loginAsGuest();
        },
        login: async (username, password) => {
          logger("Logging in as registered user.");
          const self = get();
          const res = await helpers.loginRegisteredUserB2C(
            shopperLoginClient,
            { username, password },
            {
              redirectURI: `${getAppOrigin()}/callback`,
              // usid:
            }
          );
          self._handleShopperLoginTokenResponse(res);
          logger("Logged in as registered user.");
          // enhancement TODO: if it's useful, we could automatically
          // fetch user information by calling /customers/customerId
        },
        register: async (username, password) => {},
        loginAsGuest: async () => {
          logger("Logging in as guest.");
          const self = get();
          const res = await helpers.loginGuestUser(shopperLoginClient, {
            redirectURI: `${getAppOrigin()}/callback`,
          });
          self._handleShopperLoginTokenResponse(res);
          logger("Logged in as guest.");
        },
        logout: async () => {
          logger("Logging out.");
          const self = get();
          // There is a bug with the logout helper
          // See https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/issues/88
          // const response = await helpers.logout(shopperLoginClient, {
          //   refreshToken: self.refreshToken,
          // });

          const response = await shopperLoginClient.logoutCustomer({
            parameters: {
              refresh_token: self.refreshToken,
              client_id: self._config.clientId,
              channel_id: self._config.siteId,
            },
            headers: {
              Authorization: self.accessToken,
            },
          });
          self._handleShopperLoginTokenResponse(response);
          logger("Logged out.");
          self.loginAsGuest();
        },
        _refreshAccessToken: async () => {
          logger("Using refresh token to exchange access token.");
          const self = get();
          const response = await helpers.refreshAccessToken(
            shopperLoginClient,
            {
              refreshToken: self.refreshToken,
            }
          );
          self._handleShopperLoginTokenResponse(response);
          logger("Got new access token / refresh token.");
        },
        _handleShopperLoginTokenResponse: (res) => {
          // TODO error handling
          const {
            access_token,
            refresh_token,
            customer_id,
            usid,
            enc_user_id,
            id_token,
          } = res;
          const isAuthenticated = !!access_token;
          set({
            authType: id_token ? AuthTypes.REGISTERED : AuthTypes.GUEST,
            customerId: customer_id,
            isAuthenticated,
            isInitializing: false,
            isInitialized: true,
            accessToken: access_token ? `Bearer ${access_token}` : "",
            refreshToken: refresh_token,
          });
        },
      }),
      persistStorageOptions
    )
  );

  // TODO: how do we ssr?
  store.getState()._initialize();

  return (
    <ShopperContext.Provider value={store}>{children}</ShopperContext.Provider>
  );
};

export const useShopper = () => {
  const store = useContext(ShopperContext);

  // @ts-ignore TODO
  return useStore(store);
};
