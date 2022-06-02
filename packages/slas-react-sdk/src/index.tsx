import React, { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { helpers, ShopperLogin } from "commerce-sdk-isomorphic";
import { onClient } from "./util";
import { isExpired } from "./jwt";
import { MemoryStorage } from "./storage";

interface State {
  isInitialized: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  accessToken: string;
  refreshToken: string;
  _config: CommerceAPIConfig;
  login: (email: string, password: string) => void;
  register: (email: string, password: string) => void;
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

  const logger = (text: string) => {
    if (debug) {
      console.log(`slas-react-sdk: ${text}`);
    }
  };

  const store = createStore<State>()(
    persist(
      (set, get) => ({
        _config: config,
        isInitialized: false,

        // isInitializing is default to true because we always initialize
        // immediately after we hydrate the tokens fron storage
        // in onRehydrateStorage.
        isInitializing: true,
        isAuthenticated: false,
        accessToken: "",
        refreshToken: "",
        _initialize: async () => {
          logger("INIT - start");
          const self = get();
          const isAuthenticated = !!(
            self.accessToken && !isExpired(self.accessToken)
          );

          if (isAuthenticated) {
            logger("INIT - Found access token and it's not expired.");
            set({
              isInitializing: false,
              isInitialized: true,
              isAuthenticated,
            });
            return;
          }

          if (self.refreshToken) {
            logger("INIT - Found refresh token. Starting refresh token flow.");

            await self._refreshAccessToken();
            return;
          }

          logger(
            "INIT - No access/refresh token found. Starting guest user flow."
          );
        },
        login: (email, password) => {},
        register: (email, password) => {},
        loginAsGuest: () => {},
        logout: () => {},
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
          set({
            isAuthenticated: true,
            isInitializing: false,
            isInitialized: true,
            accessToken: access_token,
            refreshToken: refresh_token,
          });
        },
      }),
      {
        name: "slas",
        getStorage: () => {
          if (onClient()) {
            return window.localStorage;
          }
          return memoryStorage;
        },
        partialize: (state) => {
          // Note: unfortunately you can't rename the field here
          return {
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
          };
        },
      }
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
