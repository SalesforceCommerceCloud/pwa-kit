const defaultConfig = require('./default.js')

module.exports = {
    ...defaultConfig,
    app: {
        url: {
            site: 'none',
            locale: 'path',
            showDefaults: true,
            interpretPlusSignAsSpace: false,

            // Set of allowed base paths. A base path is the first part of the pathname for an
            // app page. ie www.example.com/basePath/category/...
            // can be overridden for individual environments via that environment's config file
            basePaths: ['/ca'], // empty by default. can set additional allowed basePaths here
            defaultBasePath: '/ca' // empty by default. set this to /basePath to add a default basePath
        },
        defaultSite: 'RefArchGlobal',
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
    ssrNamespace: '/ca'
}