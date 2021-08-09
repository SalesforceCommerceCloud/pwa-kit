/** @jsx jsx */
import {jsx} from 'theme-ui'
import {graphql} from 'gatsby'
import {MDXRenderer} from 'gatsby-plugin-mdx'
import PropTypes from 'prop-types'
import React from 'react'
import Layout from '../components/Layout'
import SEO from '../components/SEO'
import {Styled} from 'theme-ui'

const HowToTemplate = ({data, location}) => {
    const {mdx, all} = data

    let categoryMap = {}
    let featuredCategories = []
    all.group.forEach((category) => {
        let linkMap = {}
        let categoryName
        category.edges.forEach((section) => {
            const {subcategory, title, featured} = section.node.frontmatter
            const {slug} = section.node.fields

            if (featured) {
                featuredCategories.push(section.node)
            }

            if (!categoryName) {
                categoryName = section.node.frontmatter.category
            }

            const linkEntry = {
                title,
                slug
            }

            if (!linkMap[subcategory]) {
                linkMap[subcategory] = []
            }
            let tempLinkEntries = linkMap[subcategory]
            tempLinkEntries.push(linkEntry)
            linkMap[subcategory] = tempLinkEntries
        })

        categoryMap[category.fieldValue] = {
            title: categoryName,
            linkMap
        }
    })
    return (
        <Layout location={location} column={mdx.frontmatter.column}>
            <SEO title={mdx.frontmatter.metaTitle} description={mdx.frontmatter.metaDescription} />
            <Styled.h1
                sx={{
                    fontSize: [5, 6]
                }}
            >
                {mdx.frontmatter.metaTitle}
            </Styled.h1>
            <MDXRenderer categoryMap={categoryMap} featuredCategories={featuredCategories}>
                {mdx.body}
            </MDXRenderer>
        </Layout>
    )
}

HowToTemplate.propTypes = {
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
        all: allMdx(filter: {fields: {slug: {regex: "/how-to-guides.+$/"}}}) {
            group(field: frontmatter___category) {
                edges {
                    node {
                        frontmatter {
                            title
                            metaDescription
                            category
                            featured
                            subcategory
                        }
                        fields {
                            slug
                        }
                    }
                }
                fieldValue
            }
        }
    }
`

export default HowToTemplate
