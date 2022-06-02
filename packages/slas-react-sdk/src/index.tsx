import React, { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { ShopperLogin } from "commerce-sdk-isomorphic";
import { onClient } from "./util";
import { MemoryStorage } from "./storage";

interface State {
  _config: CommerceAPIConfig;
  isInitialized: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  accessToken: string;
  refreshToken: string;
  _initialize: () => void;
  login: (email: string, password: string) => void;
  register: (email: string, password: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

interface CommerceAPIConfig {
  clientId: string;
  organizationId: string;
  shortCode: string;
  siteId: string;
}

interface ProviderProps extends CommerceAPIConfig {
  proxy?: string;
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
}: ProviderProps) => {
  // TODO: validate config value
  const config = { organizationId, clientId, siteId, shortCode };
  const ShopperLoginClient = new ShopperLogin({
    proxy,
    parameters: config,
    throwOnBadResponse: true,
  });

  const memoryStorage = new MemoryStorage();

  const store = createStore<State>()(
    persist(
      (set) => ({
        _config: config,
        isInitialized: false,
        isInitializing: false,
        isAuthenticated: false,
        accessToken: "",
        refreshToken: "",
        _initialize: () => {
          //   set({ isInitializing: true });
          //   set({ isInitializing: false, isInitialized: true });
        },
        login: (email, password) => {},
        register: (email, password) => {},
        loginAsGuest: () => {},
        logout: () => {},
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
          return {
            "cc-token": state.accessToken,
            "cc-nx": state.refreshToken,
          };
        },
        onRehydrateStorage: () => (state) => {
          console.log("onRehydrateStorage");
          console.log(state);
        },
      }
    )
  );

  setTimeout(() => store.getState()._initialize(), 3000);

  return (
    <ShopperContext.Provider value={store}>{children}</ShopperContext.Provider>
  );
};

export const useShopper = () => {
  const store = useContext(ShopperContext);

  // @ts-ignore TODO
  return useStore(store);
};
