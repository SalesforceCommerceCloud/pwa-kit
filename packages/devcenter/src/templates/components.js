/** @jsx jsx */
import {jsx} from 'theme-ui'
import {graphql} from 'gatsby'
import {MDXRenderer} from 'gatsby-plugin-mdx'
import PropTypes from 'prop-types'
import React from 'react'
import Layout from '../components/Layout'
import SEO from '../components/SEO'
import {Styled} from 'theme-ui'

const ComponentsTemplate = ({data, location}) => {
    const {mdx, componentMetadata} = data
    const mdxTitle = mdx.frontmatter.title ? mdx.frontmatter.title.toLowerCase() : ''
    return (
        <Layout location={location} className={mdxTitle} column={2}>
            <SEO title={mdx.frontmatter.metaTitle} description={mdx.frontmatter.metaDescription} />
            <Styled.h1
                sx={{
                    fontSize: [5, 6]
                }}
            >
                {mdx.frontmatter.metaTitle}
            </Styled.h1>
            <div>
                <MDXRenderer componentMetadata={componentMetadata}>{mdx.body}</MDXRenderer>
            </div>
        </Layout>
    )
}

ComponentsTemplate.propTypes = {
    data: PropTypes.shape({
        mdx: PropTypes.object.isRequired
    }).isRequired,
    location: PropTypes.object.isRequired
}

export const pageQuery = graphql`
    query($id: String!, $componentName: String!) {
        mdx(fields: {id: {eq: $id}}) {
            body
            frontmatter {
                title
                metaTitle
                metaDescription
            }
        }
        componentMetadata(displayName: {eq: $componentName}) {
            id
            displayName
            docblock
            doclets
            childrenComponentProp {
                name
                docblock
                required
                parentType {
                    name
                }
                type {
                    value
                }
                defaultValue {
                    value
                    computed
                }
            }
            composes
        }
    }
`

export default ComponentsTemplate
