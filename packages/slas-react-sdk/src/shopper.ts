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
    this.isAuthenticated = !!(this.accessToken && !isExpired(this.accessToken));
    this.isInitialized = true;

    if (this.isAuthenticated) {
      return;
    }

    if (this.refreshToken) {
      return this.refreshAccessToken();
    }
  }

  async refreshAccessToken() {
    const response = await helpers.refreshAccessToken(this.client, {
      refreshToken: this.refreshToken,
    });
    this.handleShopperLoginTokenResponse(response);
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
    // this._customerId = customer_id
    // this._saveAccessToken(`Bearer ${access_token}`)
    // this._saveUsid(usid)
    // we use id_token to distinguish guest and registered users
    // if (id_token.length > 0) {
    //     this._saveEncUserId(enc_user_id)
    //     this._saveRefreshToken(refresh_token, 'registered')
    // } else {
    //     this._saveRefreshToken(refresh_token, 'guest')
    // }
  }
}
