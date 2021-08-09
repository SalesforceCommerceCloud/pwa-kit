/** @jsx jsx */
import {jsx} from 'theme-ui'
import {graphql} from 'gatsby'
import {MDXRenderer} from 'gatsby-plugin-mdx'
import PropTypes from 'prop-types'
import React from 'react'
import Layout from '../components/Layout'
import SEO from '../components/SEO'
import {Styled} from 'theme-ui'

const CloudApiTemplate = ({
    data,
    location,
    pageContext: {
        allOpenApiSpec: {edges}
    }
}) => {
    const {mdx} = data
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

            <MDXRenderer edges={edges}>{mdx.body}</MDXRenderer>
        </Layout>
    )
}

CloudApiTemplate.propTypes = {
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
            }
        }
    }
`

export default CloudApiTemplate
