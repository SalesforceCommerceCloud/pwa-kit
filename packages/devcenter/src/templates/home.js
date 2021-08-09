import {graphql} from 'gatsby'
import {MDXRenderer} from 'gatsby-plugin-mdx'
import PropTypes from 'prop-types'
import React from 'react'
import Layout from '../components/Layout'
import SEO from '../components/SEO'
import theme from '../gatsby-plugin-theme-ui'

const HomeTemplate = ({data, location}) => {
    const {mdx, mobifyPlatform, mobifyEssentialsApisAndSdks, mobifyEssentialsGetStarted} = data

    let mobifyPlatformMap = {}

    mobifyPlatform.edges.forEach(({node}) => {
        mobifyPlatformMap[node.frontmatter.title] = {
            ...node.frontmatter,
            ...node.fields
        }
    })

    let mobifyEssentialsMap = {
        ApisAndSdks: [],
        GetStarted: []
    }

    mobifyEssentialsApisAndSdks.edges.forEach(({node}) => {
        mobifyEssentialsMap.ApisAndSdks.push({
            ...node.frontmatter,
            ...node.fields
        })
    })
    mobifyEssentialsGetStarted.edges.forEach(({node}) => {
        mobifyEssentialsMap.GetStarted.push({
            ...node.frontmatter,
            ...node.fields
        })
    })

    return (
        <Layout
            showLeftSidebar={false}
            location={location}
            isWhiteFooter={true}
            column={mdx.frontmatter.column}
            isHomePage={true}
        >
            <SEO title={mdx.frontmatter.metaTitle} description={mdx.frontmatter.metaDescription} />
            <MDXRenderer
                theme={theme}
                mobifyPlatformMap={mobifyPlatformMap}
                mobifyEssentialsApisAndSdks={mobifyEssentialsMap.ApisAndSdks}
                mobifyEssentialsGetStarted={mobifyEssentialsMap.GetStarted}
            >
                {mdx.body}
            </MDXRenderer>
        </Layout>
    )
}

HomeTemplate.propTypes = {
    data: PropTypes.shape({
        mdx: PropTypes.object.isRequired
    }).isRequired,
    location: PropTypes.object.isRequired
}

export const pageQuery = graphql`
    query($id: String!) {
        mdx(fields: {id: {eq: $id}}) {
            body
            frontmatter {
                title
                metaTitle
                metaDescription
                column
            }
        }
        mobifyPlatform: allMdx(
            filter: {
                fields: {
                    slug: {
                        regex: "/(how-to-guides|apis-and-sdks|get-started|release-notes/version-history)$/"
                    }
                }
            }
        ) {
            edges {
                node {
                    frontmatter {
                        title
                        metaTitle
                        metaDescription
                    }
                    fields {
                        slug
                    }
                }
            }
        }
        mobifyEssentialsApisAndSdks: allMdx(
            filter: {
                fields: {slug: {regex: "/apis-and-sdks/.*/(overview|endpoint|utility-functions)/"}}
            }
        ) {
            edges {
                node {
                    frontmatter {
                        category
                        title
                        metaTitle
                        metaDescription
                    }
                    fields {
                        slug
                    }
                }
            }
        }
        mobifyEssentialsGetStarted: allMdx(
            filter: {
                fields: {slug: {regex: "/get-started.+$/"}}
                frontmatter: {
                    title: {in: ["Core Technologies", "Server-Side Rendering", "Get Started"]}
                }
            }
        ) {
            edges {
                node {
                    frontmatter {
                        title
                        metaTitle
                        metaDescription
                    }
                    fields {
                        slug
                    }
                }
            }
        }
    }
`

export default HomeTemplate
