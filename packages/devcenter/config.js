const mainNav = require('./mainNavConst')

const config = {
    gatsby: {
        pathPrefix: process.env.GATSBY_PATH_PREFIX,
        siteUrl: process.env.GATSBY_SITE_URL || 'http://localhost:8000/',
        gtmTrackingId: 'GTM-TJKQ92R'
    },
    header: {
        logo: '',
        logoLink: '',
        title: 'Mobify DevCenter',
        githubUrl: 'https://github.com/mobify/mobify-platform-sdks/',
        helpUrl: '',
        search: {
            enabled: true,
            indexName:
                process.env.GATSBY_ACTIVE_ENV === 'production'
                    ? 'V1_prod_DEVCENTER'
                    : 'V1_dev_DEVCENTER',
            algoliaAppId: process.env.GATSBY_ALGOLIA_APP_ID,
            algoliaSearchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
            algoliaAdminKey: process.env.ALGOLIA_ADMIN_KEY
        },
        internalLinks: [
            {
                title: 'Get Started',
                url: `/${mainNav.GET_STARTED}`,
                internal: true
            },
            {
                title: 'APIs & SDKs',
                url: `/${mainNav.APIS_AND_SDKS}`,
                internal: true
            },
            {
                title: 'How-To Guides',
                url: `/${mainNav.HOW_TO_GUIDES}`,
                internal: true
            },
            {
                title: 'Release Notes',
                url: `/${mainNav.RELEASE_NOTES}`,
                internal: true
            }
        ],
        externalLinks: [
            {
                title: 'Support',
                url: 'https://support.mobify.com',
                internal: false
            },
            {
                title: 'Mobify Cloud',
                url: 'https://cloud.mobify.com',
                internal: false
            },
            {
                title: 'Mobify.com',
                url: 'https://mobify.com',
                internal: false
            }
        ]
    },
    sidebar: {
        // This has to be a 2D array so that we can query all of them for the sidebar content, can't use object
        // Can only force order on one level
        forcedNavOrder: [
            [
                // this is the key name (direct sub folder in content)
                mainNav.GET_STARTED,
                `/${mainNav.GET_STARTED}/index`,
                `/${mainNav.GET_STARTED}/faq`,

                // forced order for level 2
                `/${mainNav.GET_STARTED}/getting-started`,
                `/${mainNav.GET_STARTED}/architecture`,
                `/${mainNav.GET_STARTED}/support`,

                // forced order for level 3
                `/${mainNav.GET_STARTED}/architecture/overview`,
                `/${mainNav.GET_STARTED}/architecture/browser-compatibility`,
                `/${mainNav.GET_STARTED}/getting-started/about-the-platform`,
                `/${mainNav.GET_STARTED}/getting-started/installation`,
                `/${mainNav.GET_STARTED}/getting-started/running-dev-server`,
                `/${mainNav.GET_STARTED}/getting-started/orientation-exercises`,
                `/${mainNav.GET_STARTED}/getting-started/recommended-resources`
            ],
            [
                // this is the key name (direct sub folder in content)
                mainNav.HOW_TO_GUIDES,
                `/${mainNav.HOW_TO_GUIDES}/index`,

                // forced order for level 2
                `/${mainNav.HOW_TO_GUIDES}/categories/design`,
                `/${mainNav.HOW_TO_GUIDES}/categories/guides`,
                `/${mainNav.HOW_TO_GUIDES}/categories/testing`,
                `/${mainNav.HOW_TO_GUIDES}/categories/upgrades`
            ],
            [
                // this is the key name (direct sub folder in content)
                mainNav.APIS_AND_SDKS,
                `/${mainNav.APIS_AND_SDKS}/index`,

                // forced order for level 2
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk`,
                `/${mainNav.APIS_AND_SDKS}/commerce-integrations`,
                `/${mainNav.APIS_AND_SDKS}/component-library`,
                `/${mainNav.APIS_AND_SDKS}/mobify-cloud`,

                `/${mainNav.APIS_AND_SDKS}/component-library/components`,
                `/${mainNav.APIS_AND_SDKS}/component-library/templates`,

                `/${mainNav.APIS_AND_SDKS}/mobify-cloud/overview`,
                `/${mainNav.APIS_AND_SDKS}/mobify-cloud/rest-api`,

                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/analytics-integrations/index`,

                `/${mainNav.APIS_AND_SDKS}/commerce-integrations/overview`,

                // forced order for level 3
                `/${mainNav.APIS_AND_SDKS}/mobify-cloud/index`,

                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/index`,
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/analytics-integrations`,

                // forced order for level 4
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/analytics-integrations/overview`
            ],
            [
                // this is the key name (direct sub folder in content)
                mainNav.RELEASE_NOTES,
                `/${mainNav.RELEASE_NOTES}/index`,

                // forced order for level 2
                `/${mainNav.RELEASE_NOTES}/archive`,

                // forced order for level 3
                `/${mainNav.RELEASE_NOTES}/archive/version-history`,
                `/${mainNav.RELEASE_NOTES}/archive/2020-02`,
                `/${mainNav.RELEASE_NOTES}/archive/2020-01`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-11`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-09`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-07`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-05`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-03`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-02`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-01`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-11`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-09`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-08`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-06`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-05`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-03`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-02`,
                `/${mainNav.RELEASE_NOTES}/archive/2018-01`,
                `/${mainNav.RELEASE_NOTES}/archive/2017-11`,
                `/${mainNav.RELEASE_NOTES}/archive/2017-09`
            ]
        ]
    },
    siteMetadata: {
        title: 'Mobify DevCenter',
        description: 'Mobify DevCenter',
        ogImage: null,
        docsLocation: 'https://github.com/mobify/mobify-platform-sdks/'
    }
}

module.exports = config
