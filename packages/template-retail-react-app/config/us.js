const defaultConfig = require('./default.js')
const sites = require('./sites.js')

module.exports = {
    ...defaultConfig,
    app: {
        url: {
            site: 'path',
            locale: 'path',
            showDefaults: true,
            interpretPlusSignAsSpace: false
        },
        defaultSite: 'RefArch',
        siteAliases: {
            RefArch: 'us',
            RefArchGlobal: 'global'
        },
        sites,
        commerceAPI: {
            proxyPath: `/mobify/proxy/api`,
            parameters: {
                // TODO: Changed for testing private client. Restore config before merging.
                clientId: '6f450324-d2f3-4c69-b6a0-b5acf35eed16',
                organizationId: 'f_ecom_zzrf_001',
                shortCode: 'kv7kzm78',
                siteId: 'RefArch'
            }
        },
        einsteinAPI: {
            host: 'https://api.cquotient.com',
            einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
            // This differs from the siteId in commerceAPIConfig for testing purposes
            siteId: 'aaij-MobileFirst',
            isProduction: false
        }
    },
    ssrNamespace: '/us'
}