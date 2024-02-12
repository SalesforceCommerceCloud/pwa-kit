
// import {isRemote} from '../ssr-server'
import {proxyConfigs} from '../ssr-shared'
import {createProxyMiddleware} from 'http-proxy-middleware'

/**
 * This express middleware creates a custom endpoint that injects
 * the SLAS private client secret onto the Authorization header on
 * requests bound for SLAS.
 *
 * This middleware explicitly excludes the SLAS /login endpoint as
 * this endpoint uses the Authorization header for sending a shopper's
 * login credentials.
 *
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next callback
 */
export const injectSlasPrivateClientSecret = (req, res, next) => {
    const path = req.path
    console.log(`Request path: ${path}`)

    // early exit if request is not bound for SLAS
    if (!path.includes('/shopper/auth')) {
        next()
    }

    let target
    proxyConfigs.forEach((config) => {
        if (config.path == 'api') {
            target = config.host
        }
    })

    const proxy = createProxyMiddleware({
        // TODO: Is the protocal always https?
        target: `https://${target}`,

        // Configs copied over from the original proxies defined in
        // configure-proxy.js
        changeOrigin: true,
        followRedirects: false,
        cookieDomainRewrite: {
            targetHost: target
        },
        cookiePathRewrite: false,

        // All requests that reach this point will include the custom proxy part
        // (ie. /ssr/auth.) We need to strip that part out before sending the
        // request through to SLAS
        // TODO: Need to make sure this path matches the path defined in ssr.js
        pathRewrite: {'^/ssr/auth' : ''},

        onProxyReq: (slasRequest, incomingReqest) => {
            const headers = Object.keys(incomingReqest.headers)

            // exclude SLAS authenticateCustomer (/login) as it uses
            // the authorization header for a different purpose
            if (!path.includes('/login') && headers.includes('authorization')) {
                console.log('In replacement')
                const clientId = process?.env?.SLAS_PRIVATE_CLIENT_ID
                const clientSecret = process?.env?.SLAS_PRIVATE_CLIENT_SECRET
                console.log(`${clientId} ${clientSecret}`)
                const encodedClientCredential = Buffer.from(`${clientId}:${clientSecret}`).toString(
                    'base64'
                )
                slasRequest.setHeader('Authorization', `Basic ${encodedClientCredential}`)
            }
        }
    })

    proxy(req,res,next)
}