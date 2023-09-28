import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {Headers} from 'headers-polyfill'
import fetch from 'cross-fetch'

type requestOptions = {
    method: string;
    headers: Headers;
    body?: URLSearchParams;
    redirect: any;
}

type Config = {
    proxyPath: string;
    parameters: {
        clientId: string;
        organizationId: string;
        shortCode: string;
        siteId: string;
    }
}

const proxy = `/mobify/proxy/ocapi`

export class OcapiApi {
    baseUrl: string
    oathUrl: string
    dataUrl: string
    shopUrl: string
    clientID: string
    headers: Headers
    urlencoded: URLSearchParams
    requestOptions: requestOptions
    api: any

    constructor(config: Config) {
        this.baseUrl = `${getAppOrigin()}${proxy}`
        this.oathUrl =
            this.baseUrl + '/dw/oauth2/access_token?client_id=' + config.parameters.clientId

        this.dataUrl =
            this.baseUrl + '/s/Sites-Site/dw/data/v21_3/sites/' + config.parameters.siteId + '/'

        this.shopUrl = this.baseUrl + '/s/' + config.parameters.siteId + '/dw/shop/v21_3/'

        this.clientID = config.parameters.clientId
    }

    async getAllGroups() {
        this.headers = new Headers()
        this.headers.append('x-dw-client-id', this.clientID)

        this.requestOptions = {
            method: 'GET',
            headers: this.headers,
            redirect: 'follow'
        }

        const response = await fetch(this.shopUrl + 'folders/(root)?levels=0', this.requestOptions)
        const json = await response.json()

        if (json.fault) {
            return null
        } else {
            return json
        }
    }
}

export default OcapiApi
