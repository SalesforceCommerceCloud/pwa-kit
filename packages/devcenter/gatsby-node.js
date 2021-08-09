const path = require('path')
const startCase = require('lodash.startcase')
const openApiProcessor = require('./src/utils/processor')
const fetch = require('node-fetch')

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
            allOpenApiSpec {
                edges {
                    node {
                        description
                        paths: childrenOpenApiSpecPath {
                            fullPath
                            verb
                            description
                            operationId
                            parameters {
                                description
                                in
                                name
                                required
                                schema {
                                    type
                                }
                            }
                            requestBody: childrenOpenApiSpecRequestBodySchemas {
                                required
                                properties {
                                    description
                                    enum
                                    name
                                    type
                                }
                                example
                            }
                            response: childOpenApiSpecResponse {
                                statusCode
                                description
                                example
                            }
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
            } else if (node.fields.slug.match(/apis-and-sdks\/mobify-cloud/g)) {
                component = path.resolve('./src/templates/cloud-api.js')
                context['id'] = node.fields.id
                context['allOpenApiSpec'] = data.allOpenApiSpec
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

const toNode = (data, type, createContentDigest) => {
    const openApiPrefix = 'openapi.'

    if (!data) {
        throw new Error('No data object specified')
    }

    if (!type) {
        throw new Error('No type specified')
    }

    if (!data.hasOwnProperty('id')) {
        throw new Error('Data object has no id property')
    }

    if (!data.hasOwnProperty('parent')) {
        throw new Error('Data object has no parent property')
    }

    if (!data.hasOwnProperty('children') || !Array.isArray(data.children)) {
        throw new Error('Data object has no children array property')
    }

    if (data.hasOwnProperty('fields') && data.hasOwnProperty('meta')) {
        throw new Error('Data object defines both a fields and a meta property')
    }

    if (!data.hasOwnProperty('fields') && !data.hasOwnProperty('meta')) {
        throw new Error('Data object does not define a fields or meta property')
    }

    const node = Object.assign(
        {
            id: `${openApiPrefix}${data.id}`,
            parent: data.parent ? `${openApiPrefix}${data.parent}` : null,
            children: data.children.map((c) => `${openApiPrefix}${c}`),
            internal: {
                type
            }
        },
        data.fields
    )

    if (data.meta) {
        node.internal.contentDigest = createContentDigest(data.meta.content)
        node.internal.mediaType = data.meta.mediaType
        node.internal.content = data.meta.content
        return node
    }

    node.internal.contentDigest = createContentDigest(JSON.stringify(data.fields))
    return node
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

const SUCCESS_REMOTE_FILE_DOWNLOADED = 'Remote file {0} was downloaded'
const FAILED_REMOTE_FILE_DOWNLOADED = "Can't download the remote file from {0}"
// download json file provided by ADN team for Cloud API
exports.sourceNodes = async ({actions, createContentDigest, reporter}) => {
    const url = 'https://docs.mobify.com/openapi/cloud/openapi-schema.json'

    try {
        const {createNode} = actions
        const response = await fetch(url)
        const resultData = await response.json()
        if (resultData) {
            reporter.success(SUCCESS_REMOTE_FILE_DOWNLOADED.replace('{0}', url))
        }

        const baseUrl = 'https://cloud.mobify.com'
        const result = openApiProcessor('cloud-api', resultData, baseUrl)

        const nodes = []
        nodes.push(toNode(result.information, 'OpenApiSpec', createContentDigest))
        result.paths.forEach((p) => {
            nodes.push(toNode(p, 'OpenApiSpecPath', createContentDigest))
        })
        result.responses.forEach((r) => {
            nodes.push(toNode(r, 'OpenApiSpecResponse', createContentDigest))
        })
        result.requestBodySchemas.forEach((d) => {
            nodes.push(toNode(d, 'OpenApiSpecRequestBodySchemas', createContentDigest))
        })

        nodes.forEach((n) => {
            createNode(n)
        })
    } catch (e) {
        console.log('e', e)
        reporter.error(FAILED_REMOTE_FILE_DOWNLOADED.replace('{0}', url))
    }
}
