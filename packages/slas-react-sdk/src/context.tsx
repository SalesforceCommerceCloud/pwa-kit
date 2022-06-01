import React, { createContext, useEffect } from "react";
import { ShopperLogin } from "commerce-sdk-isomorphic";
import Shopper from "./shopper";

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

export const Context = createContext({
  // TODO: do we need to store config in the context? probably NO!
  config: {
    clientId: "",
    organizationId: "",
    shortCode: "",
    siteId: "",
  },
});
export const useContext = (): { config: CommerceAPIConfig } =>
  React.useContext(Context);
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

  // TODO: should we use hook/reducers instead of this singleton?
  const shopper = new Shopper(ShopperLoginClient);
  const value = {
    config,
    shopper,
  };

  useEffect(() => {
    shopper.init();
  }, []);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};
