import { onClient } from "./util";

export const decode = (jwt: string) => {
  const base64Url = jwt.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const base64Decode = onClient()
    ? atob(base64)
    : Buffer.from(base64, "base64").toString("binary");
  const jsonPayload = decodeURIComponent(
    base64Decode
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
};

export const isExpired = (jwt: string) => {
  const { exp } = decode(jwt);
  const expired = Date.now() >= exp * 1000;
  return expired;
};
