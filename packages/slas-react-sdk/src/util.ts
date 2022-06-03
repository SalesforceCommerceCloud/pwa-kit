export const onClient = () => typeof window !== "undefined";

// This is copied from pwa-kit-react-sdk
export const getAppOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const { APP_ORIGIN } = process.env;

  if (!APP_ORIGIN) {
    throw new Error(
      `Application is not initialized. Please ensure '_createApp' has been invoked before using this method.`
    );
  }

  return process.env.APP_ORIGIN;
};
