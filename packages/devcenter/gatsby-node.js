const path = require('path')
const startCase = require('lodash.startcase')

exports.createPages = async ({graphql, actions}) =>
    await graphql(`
        query {
            allMdx(filter: {fileAbsolutePath: {regex: "/content/"}}) {
                edges {
                    node {
                        fields {
                            id
                            slug
                        }
                        tableOfContents
                        frontmatter {
                            title
                            metaTitle
                            metaDescription
                        }
                    }
                }
            }
        }
    `).then(({data, errors}) => {
        if (errors) {
            return Promise.reject(errors)
        }

        data.allMdx.edges.forEach(({node}) => {
            let component = ''
            let context = {}
            if (node.fields.slug === '/' || node.fields.slug.match(/resources\//g)) {
                component = path.resolve('./src/templates/home.js')
                context['id'] = node.fields.id
            } else if (node.fields.slug === '/how-to-guides') {
                component = path.resolve('./src/templates/howto.js')
                context['id'] = node.fields.id
            } else if (node.fields.slug.match(/apis-and-sdks\/component-library\/components/g)) {
                component = path.resolve('./src/templates/components.js')
                context['id'] = node.fields.id
                context['componentName'] = node.frontmatter.metaTitle
            } else {
                component = path.resolve('./src/templates/docs.js')
                context['id'] = node.fields.id
            }

            actions.createPage({
                path: node.fields.slug || '/',
                component: component,
                context
            })
        })
    })

exports.onCreateWebpackConfig = ({actions}) => {
    actions.setWebpackConfig({
        resolve: {
            modules: [path.resolve(__dirname, 'src'), 'node_modules'],
            alias: {
                $components: path.resolve(__dirname, 'src/components'),
                // Fork of the Bublé transpilation library used by react-live that powers our live code examples.
                // This fork strips out the regenerate-unicode-properties library to shrink the bundle size.
                // More info: https://www.npmjs.com/package/react-live
                buble: path.resolve(__dirname, 'node_modules/@philpl/buble')
            }
        }
    })
}

exports.onCreateNode = async ({node, getNode, actions, loadNodeContent, createContentDigest}) => {
    const {createNodeField} = actions
    // create pages based each mdx files
    if (node.internal.type === `Mdx`) {
        const parent = getNode(node.parent)
        let value = ''
        if (parent.relativePath !== undefined) {
            value = `${parent.sourceInstanceName}/${parent.relativePath.replace(parent.ext, '')}`
                .replace('content/', '')
                .replace('/index', '')
        }

        if (value === 'index') {
            value = ''
        }

        const group =
            parent.relativePath && parent.relativePath.includes('/')
                ? parent.dir.split('/').slice(-1)[0]
                : parent.relativeDirectory
        createNodeField({
            name: 'group',
            node,
            value: node.frontmatter.category || group || 'root'
        })

        createNodeField({
            name: 'collection',
            node,
            value: node.frontmatter.collection || parent.sourceInstanceName
        })

        createNodeField({
            name: `slug`,
            node,
            value: `/${value}`
        })

        createNodeField({
            name: 'id',
            node,
            value: node.id
        })

        createNodeField({
            name: 'title',
            node,
            value: node.frontmatter.title || startCase(parent.name)
        })
    }
}
