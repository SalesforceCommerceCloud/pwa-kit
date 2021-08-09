require('dotenv').config()
const queries = require('./src/utils/algolia')
const config = require('./config')

const requiredEnvVars = ['GATSBY_ALGOLIA_APP_ID', 'GATSBY_ALGOLIA_SEARCH_KEY', 'ALGOLIA_ADMIN_KEY']

requiredEnvVars.forEach((key) => {
    if (process.env[key] === undefined) {
        console.error(
            `You are missing environment variable ${key}. This can be set in your local .env file.`
        )
        process.exit(1)
    }
})

const plugins = [
    'gatsby-plugin-sitemap',
    'gatsby-plugin-sharp',
    {
        resolve: 'gatsby-plugin-catch-links',
        options: {
            excludePattern: /static\//,
            excludeRegex: /static\//
        }
    },
    {
        resolve: 'gatsby-plugin-mdx',
        options: {
            gatsbyRemarkPlugins: [
                {
                    resolve: `gatsby-remark-autolink-headers`,
                    options: {
                        icon: false,
                        enableCustomId: true
                    }
                },
                {
                    resolve: 'gatsby-remark-copy-linked-files'
                },
                {
                    resolve: 'gatsby-remark-external-links',
                    options: {
                        target: '_self',
                        rel: 'external nofollow'
                    }
                },
                {
                    resolve: 'gatsby-remark-images',
                    options: {
                        maxWidth: 1035,
                        showCaptions: ['title'],
                        markdownCaptions: false,
                        wrapperStyle: 'margin-left: 0;'
                    }
                },
                {
                    resolve: 'gatsby-remark-smartypants',
                    options: {
                        dashes: 'oldschool',
                        backticks: false
                    }
                }
            ],
            // Repeat config for gatsby-remark-images here to work around bug in gatsby-plugin-mdx
            plugins: [
                'gatsby-plugin-catch-links',
                {
                    resolve: 'gatsby-remark-images',
                    options: {
                        maxWidth: 1035,
                        showCaptions: ['title'],
                        markdownCaptions: false
                    }
                },
                {
                    resolve: 'gatsby-remark-copy-linked-files'
                }
            ],
            extensions: ['.mdx']
        }
    },
    'gatsby-plugin-emotion',
    'gatsby-plugin-react-helmet',
    {
        resolve: 'gatsby-plugin-sass',
        options: {
            data: `@import "../progressive-web-sdk/styleguide/styles/_variables";`
        }
    },
    'gatsby-plugin-theme-ui',
    {
        resolve: `gatsby-plugin-manifest`,
        options: {
            name: `Mobify DevCenter`,
            short_name: `Mobify DevCenter`,
            start_url: `/`,
            background_color: `#ffffff`,
            theme_color: `#012a3b`,
            display: `standalone`,
            icon: 'src/images/mobify-site-icon.png'
        }
    },

    'gatsby-transformer-react-docgen',
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            name: 'components',
            path: `../progressive-web-sdk/src/components/`,
            ignore: [`**/*.md`, `**/*.scss`, `**/*test.js`]
        }
    },
    {
        resolve: `gatsby-plugin-gdpr-cookies`,
        options: {
            googleTagManager: {
                trackingId: config.gatsby.gtmTrackingId,
                cookieName: 'gatsby-gdpr-google-tagmanager', // default
                dataLayerName: 'dataLayer' // default
            },
            // defines the environments where the tracking should be available
            environments: ['production']
        }
    },
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            name: `apis-and-sdks`,
            path: `${__dirname}/content/apis-and-sdks`
        }
    },
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            name: `get-started`,
            path: `${__dirname}/content/get-started`
        }
    },
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            name: `how-to-guides`,
            path: `${__dirname}/content/how-to-guides`
        }
    },
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            name: `release-notes`,
            path: `${__dirname}/content/release-notes`
        }
    },
    {
        resolve: `gatsby-source-filesystem`,
        options: {
            name: `content`,
            path: `${__dirname}/content/`
        }
    }
]
if (
    config.header.search &&
    config.header.search.enabled &&
    config.header.search.algoliaAppId &&
    config.header.search.algoliaAdminKey
) {
    plugins.push({
        resolve: `gatsby-plugin-algolia`,
        options: {
            appId: config.header.search.algoliaAppId, // Algolia application id
            apiKey: config.header.search.algoliaAdminKey, // Algolia admin key to index
            queries,
            chunkSize: 10000 // default: 1000
        }
    })
}
module.exports = {
    pathPrefix: config.gatsby.pathPrefix,
    siteMetadata: {
        title: config.siteMetadata.title,
        name: config.siteMetadata.title,
        description: config.siteMetadata.description,
        docsLocation: config.siteMetadata.docsLocation,
        ogImage: config.siteMetadata.ogImage,
        versions: config.siteMetadata.versions,
        logo: {
            link: config.header.logoLink ? config.header.logoLink : '/',
            image: config.header.logo
        }, // backwards compatible
        headerTitle: config.header.title,
        githubUrl: config.header.githubUrl,
        helpUrl: config.header.helpUrl,
        headerLinks: config.header.links,
        siteUrl: config.gatsby.siteUrl,
        social: [
            {
                name: `github`,
                url: `https://github.com/mobify/`
            },
            {
                name: `twitter`,
                url: `https://twitter.com/mobify`
            }
        ],
        sidebarConfig: {
            forcedNavOrder: config.sidebar.forcedNavOrder
        },
        internalLinks: config.header.internalLinks,
        externalLinks: config.header.externalLinks
    },
    plugins: plugins
}
