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
                process.env.GATSBY_ACTIVE_ENV === 'production' ? 'prod_DEVCENTER' : 'dev_DEVCENTER',
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

                // forced order for level 2
                `/${mainNav.GET_STARTED}/architecture`,
                `/${mainNav.GET_STARTED}/resources`,

                // forced order for level 3
                `/${mainNav.GET_STARTED}/architecture/core-technologies`,
                `/${mainNav.GET_STARTED}/architecture/react-component-hierarchy`,
                `/${mainNav.GET_STARTED}/architecture/project-scaffold`,
                `/${mainNav.GET_STARTED}/architecture/integrations`,
                `/${mainNav.GET_STARTED}/architecture/universal-react-rendering`,
                `/${mainNav.GET_STARTED}/architecture/deployment-infrastructure`,
                `/${mainNav.GET_STARTED}/architecture/app-server-overview`,
                `/${mainNav.GET_STARTED}/architecture/browser-compatibility`
            ],
            [
                // this is the key name (direct sub folder in content)
                mainNav.HOW_TO_GUIDES,
                `/${mainNav.HOW_TO_GUIDES}/index`,

                // forced order for level 2
                `/${mainNav.HOW_TO_GUIDES}/categories/analytics`,
                `/${mainNav.HOW_TO_GUIDES}/categories/deployment`,
                `/${mainNav.HOW_TO_GUIDES}/categories/design`,
                `/${mainNav.HOW_TO_GUIDES}/categories/integrations`,
                `/${mainNav.HOW_TO_GUIDES}/categories/internationalization`,
                `/${mainNav.HOW_TO_GUIDES}/categories/performance`,
                `/${mainNav.HOW_TO_GUIDES}/categories/project-planning`,
                `/${mainNav.HOW_TO_GUIDES}/categories/state-management`,
                `/${mainNav.HOW_TO_GUIDES}/categories/server-side-rendering`,
                `/${mainNav.HOW_TO_GUIDES}/categories/testing`
            ],
            [
                // this is the key name (direct sub folder in content)
                mainNav.APIS_AND_SDKS,
                `/${mainNav.APIS_AND_SDKS}/index`,

                // forced order for level 2
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk`,
                `/${mainNav.APIS_AND_SDKS}/commerce-integrations`,
                `/${mainNav.APIS_AND_SDKS}/component-library`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components`,
                `/${mainNav.APIS_AND_SDKS}/component-library/templates`,
                `/${mainNav.APIS_AND_SDKS}/mobify-cloud`,
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/analytics-integrations/index`,

                `/${mainNav.APIS_AND_SDKS}/commerce-integrations/overview`,

                // forced order for level 3
                `/${mainNav.APIS_AND_SDKS}/component-library/index`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Accordion`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/AccordionItem`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Badge`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Banner`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/BazaarvoiceReview`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Breadcrumbs`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Button`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Card`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Carousel`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/CarouselItem`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/DangerousHTML`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Divider`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Feedback`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/HeaderBar`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/HeaderBarActions`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/HeaderBarTitle`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Icon`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/IconLabel`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Image`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/InlineLoader`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/LazyLoadContent`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/LazyLoader`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Ledger`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/LedgerRow`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Link`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/List`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/ListTile`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Lockup`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/MegaMenu`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/MegaMenuItem`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Nav`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/NavHeader`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/NavItem`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/NavMenu`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/NavSlider`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Pagination`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/PasswordInput`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Popover`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Price`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/ProgressSteps`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/ProgressStepsItem`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Rating`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Ratio`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Review`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/ReviewSummary`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Scroller`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/ScrollTo`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/ScrollTrigger`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Search`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Share`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Sheet`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/SkeletonBlock`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/SkeletonInline`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/SkeletonText`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/SkipLinks`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Split`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Swatch`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/SwatchItem`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Tabs`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/TabsPanel`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Tile`,
                `/${mainNav.APIS_AND_SDKS}/component-library/components/Toggle`,
                `/${mainNav.APIS_AND_SDKS}/mobify-cloud/index`,

                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/index`,
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/analytics-integrations`,
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/SSR`,
                `/${mainNav.APIS_AND_SDKS}/progressive-web-sdk/utils`,

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
                `/${mainNav.RELEASE_NOTES}/archive/2020-10`,
                `/${mainNav.RELEASE_NOTES}/archive/2020-08`,
                `/${mainNav.RELEASE_NOTES}/archive/2020-05`,
                `/${mainNav.RELEASE_NOTES}/archive/2020-04`,
                `/${mainNav.RELEASE_NOTES}/archive/2020-02`,
                `/${mainNav.RELEASE_NOTES}/archive/2020-01`,
                `/${mainNav.RELEASE_NOTES}/archive/2019-11`,
                `/${mainNav.RELEASE_NOTES}/archive/sdk-version-1`
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
