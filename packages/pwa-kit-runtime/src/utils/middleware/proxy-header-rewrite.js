import {proxyConfigs} from '../ssr-shared'
import {createProxyMiddleware} from 'http-proxy-middleware'

export const proxyHeaderRewrite = (options) => {
    console.log('In custom middleware')
    const middlewares = options.rewrite.map((config) => {

        console.log(`Creating proxy for ${config.path}`)
        const pathRegex = `^${config.path}`
        const headers = config.headers

        const proxy = createProxyMiddleware({
            target: config.target,

            // Configs copied over from the original proxies defined in
            // configure-proxy.js
            changeOrigin: true,
            followRedirects: false,
            cookieDomainRewrite: {
                targetHost: options.origin
            },
            cookiePathRewrite: false,

            // All requests that reach this point will include the custom proxy part
            // (ie. /ssr/auth.) We need to strip that part out before sending the
            // request through
            pathRewrite: {[pathRegex] : ''},

            onProxyReq: (outgoingRequest, incomingRequest) => {
                console.log(`Incoming request: ${incomingRequest.path}`)
                console.log(`Outgoing request: ${outgoingRequest.path}`)

                Object.entries(headers).forEach(([key, value]) => {
                    console.log(`${key} ${value}`)
                    outgoingRequest.setHeader(key, value)
                })
            }
        })

        return {
            path: config.path,
            proxy: proxy
        }
    })

    const getMiddleware = (path) => {
        return middlewares.find((middleware) => path.includes(middleware.path))
    }

    return (req, res, next) => {
        const path = req.path
        console.log(`Path: ${path}`)

        const middleware = getMiddleware(path)
        if (middleware) {
            console.log('Middlware Found')
            middleware.proxy(req,res,next)
        } else {
            next()
        }
    }
}