import { helpers, ShopperLogin } from "commerce-sdk-isomorphic";
import { Storage, LocalStorage } from "./storage";
import { isExpired } from "./jwt";
import { onClient } from "./util";

// TODO: this isn't exported from commerce-sdk-isomorphic
// so we have to manually declare it here
interface ShopperLoginParameters {
  clientId: string;
  organizationId: string;
  shortCode: string;
}

interface ShopperLoginClient
  extends ShopperLogin<ShopperLoginParameters & Record<string, unknown>> {}

export default class Shopper {
  isInitialized: boolean = false;
  isAuthenticated: boolean = false;
  private client: ShopperLoginClient;
  private storage: Storage;

  KEYS = {
    ACCESS_TOKEN: "cc-token",
    REFRESH_TOKEN: "cc-nx",
  };

  constructor(client: ShopperLoginClient) {
    this.client = client;
    this.storage = onClient() ? new LocalStorage() : new Map();
  }

  get accessToken() {
    return this.storage.get(this.KEYS.ACCESS_TOKEN);
  }

  get refreshToken() {
    return this.storage.get(this.KEYS.REFRESH_TOKEN);
  }

  async init() {
    // This is automatically called from SLAS provider
    // Flow:
    // 1. if we have a valid access token, do nothing
    // 2. if we have a valid refresh token, do refresh token flow
    // 3. else, start guest shopper PKCE flow
    this.isAuthenticated = !!(this.accessToken && !isExpired(this.accessToken));
    this.isInitialized = true;

    if (this.isAuthenticated) {
      return; // TODO: determine the return value of this method
    }

    if (this.refreshToken) {
      return this.refreshAccessToken();
    }

    return this.loginAsGuest();
  }

  async refreshAccessToken() {
    const response = await helpers.refreshAccessToken(this.client, {
      refreshToken: this.refreshToken,
    });
    this.handleShopperLoginTokenResponse(response);

    // TODO: return
  }

  async loginAsGuest() {
    // TODO: implement PKCE flow
    // 1. generate code_verifier and code_challenge
    // 2. POST /authorize
    // 3. receive authorization_code from redirect uri
    // 4. POST /token grant_type=authorization_code_pkce
    // 5. handle response and save token in the storage
  }

  async logout() {
    // TODO:
    // 1. call shopperLogin.logoutCustomer() (is there a slas helper from isomorphic sdk?)
    // 2. empty storage
    // 3. login as guest again
  }

  private handleShopperLoginTokenResponse(res: helpers.TokenResponse) {
    const {
      access_token,
      refresh_token,
      customer_id,
      usid,
      enc_user_id,
      id_token,
    } = res;
    console.log(res);

    // TODO: save tokens in storage
  }
}
