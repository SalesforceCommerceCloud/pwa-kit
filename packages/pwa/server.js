// Basic, working proxying implementation.
const express = require('express')
const HPM = require('http-proxy-middleware')

const scapiProxy = HPM.createProxyMiddleware({
    target: 'https://8o7m175y.api.commercecloud.salesforce.com',
    // target: 'https://httpbin.org/',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
        '^/scapi-proxy/': '/'
    },
    onProxyReq: function(proxyReq) {
        delete proxyReq['origin']
    }
})

const app = express()
app.all('/scapi-proxy/*', scapiProxy)

const HTTP_PORT = 3000
app.listen(HTTP_PORT, () => {
    console.log(`Example app listening at http://localhost:${HTTP_PORT}`)
})
