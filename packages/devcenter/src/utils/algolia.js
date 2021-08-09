const config = require('../../config.js')

const pageQuery = `{
  pages: allMdx (filter: {fileAbsolutePath: {regex: "/content/"}}) {
    edges {
      node {
        objectID: id
        fields {
          slug
          collection
        }
        frontmatter {
          metaTitle
        }
        excerpt(pruneLength: 500)
      }
    }
  }
}`

const flatten = (arr) =>
  arr.map(({node: {frontmatter, fields, ...rest}}) => ({
    ...frontmatter,
    ...fields,
    ...rest
  }))

const settings = {attributesToSnippet: [`excerpt:25`]}

const indexName = config.header.search ? config.header.search.indexName : ''

const queries = [
  {
    query: pageQuery,
    transformer: ({data}) => flatten(data.pages.edges),
    indexName: `${indexName}`,
    settings
  }
]

module.exports = queries
