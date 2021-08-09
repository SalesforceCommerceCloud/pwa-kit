import {graphql, useStaticQuery} from 'gatsby'
import PropTypes from 'prop-types'
import React from 'react'
import Helmet from 'react-helmet'
import siteImage from '../images/site-image.jpg'
import favicon32 from "../images/favicon32x32.png";

/**
 * This react helmt code is adapted from
 * https://themeteorchef.com/tutorials/reusable-seo-with-react-helmet.
 *
 * A great tutorial explaining how to setup a robust version of an
 * SEO friendly react-helmet instance.
 *
 *
 * Use the Helmt on pages to generate SEO and meta content!
 *
 * Usage:
 * <SEO
 *   title={title}
 *   description={description}
 *   image={image}
 * />
 *
 */

const seoQuery = graphql`
    {
        allSite {
            edges {
                node {
                    siteMetadata {
                        title
                        name
                        siteUrl
                        description
                        social {
                            name
                            url
                        }
                    }
                }
            }
        }
    }
`

const SEO = ({title, description, url, pathname}) => {
    const results = useStaticQuery(seoQuery)
    const site = results.allSite.edges[0].node.siteMetadata
    const twitter = site.social.find((option) => option.name === 'twitter') || {}

    const fullURL = (path) => (path ? `${site.siteUrl}${path}` : site.siteUrl)

    const pageTitle = title && site.title ? `${title} | ${site.title}` : title
    const pageDescription = description || site.description

    const metaTags = [
        {charset: 'utf-8'},
        {
            'http-equiv': 'X-UA-Compatible',
            content: 'IE=edge'
        },
        {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1'
        },
        {
            rel: 'canonical',
            href: fullURL(pathname)
        },
        {itemprop: 'name', content: pageTitle},
        {itemprop: 'description', content: pageDescription},
        {itemprop: 'image', content: fullURL(siteImage)},
        {name: 'description', content: pageDescription},

        {name: 'twitter:card', content: 'summary_large_image'},
        {name: 'twitter:site', content: site.siteName},
        {name: 'twitter:title', content: pageTitle},
        {name: 'twitter:description', content: pageDescription},
        {name: 'twitter:creator', content: twitter.url},
        {
            name: 'twitter:image',
            content: fullURL(siteImage)
        },

        {property: 'og:title', content: pageTitle},
        {property: 'og:url', content: url},
        {property: 'og:image', content: fullURL(siteImage)},
        {property: 'og:description', content: pageDescription},
        {property: 'og:site_name', content: site.siteName}
    ]

    return (
        <Helmet title={pageTitle} htmlAttributes={{lang: 'en'}} meta={metaTags} link={[{rel: 'icon', type: 'image/png', sizes: "32x32", href: `${favicon32}`}
        ]} />)
}

SEO.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    url: PropTypes.string,
    pathname: PropTypes.string
}

SEO.defaultProps = {
    title: '',
    description: '',
    url: '',
    pathname: ''
}

export default SEO
