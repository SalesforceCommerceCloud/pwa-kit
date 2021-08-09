/** @jsx jsx */
import {jsx} from 'theme-ui'
import {graphql} from 'gatsby'
import {MDXRenderer} from 'gatsby-plugin-mdx'
import PropTypes from 'prop-types'
import React from 'react'
import Layout from '../components/Layout'
import SEO from '../components/SEO'
import {Styled} from 'theme-ui'

const DocsTemplate = ({data, location}) => {
    const {mdx} = data
    const mdxTitle = mdx.frontmatter.title ? mdx.frontmatter.title.toLowerCase() : ''
    return (
        <Layout
            isJsdocPage={mdx.frontmatter.isJsdocPage}
            location={location}
            className={mdxTitle}
            column={mdx.frontmatter.column || 3}
        >
            <SEO title={mdx.frontmatter.metaTitle} description={mdx.frontmatter.metaDescription} />
            <Styled.h1
                sx={{
                    fontSize: [5, 6]
                }}
            >
                {mdx.frontmatter.metaTitle}
            </Styled.h1>
            <div>
                <MDXRenderer>{mdx.body}</MDXRenderer>
            </div>
        </Layout>
    )
}

DocsTemplate.propTypes = {
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
                isJsdocPage
                metaTitle
                metaDescription
                column
            }
        }
    }
`

export default DocsTemplate
