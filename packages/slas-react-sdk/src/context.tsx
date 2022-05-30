import React, { createContext } from "react";

interface SlasConfig {
  clientId: string;
  organizationId: string;
  siteId: string;
}

interface ProviderProps extends SlasConfig {
  children: React.ReactNode;
}

export const Context = createContext({
  clientId: "",
  organizationId: "",
  siteId: "",
});
export const useContext = (): SlasConfig => React.useContext(Context);
export const Provider = ({
  children,
  organizationId,
  clientId,
  siteId,
}: ProviderProps) => {
  // TODO: validate input
  const config = { organizationId, clientId, siteId };

  return <Context.Provider value={config}>{children}</Context.Provider>;
};
