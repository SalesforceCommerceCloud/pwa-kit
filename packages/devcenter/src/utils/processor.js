/**
 * inspired by https://github.com/devdigital/gatsby-source-openapi-aggregate, adapted to be compatible with openApi v2
 * Process the open api data to be ready for being transformed to Gatsby Node
 *
 * @param name - unique name for the returned data
 * @param spec - open api json data
 * @param basePath - base path for the endpoints
 * @returns {{paths: [], requestBodySchemas: [], responses: [], information: {parent: null, children: *[], id: string, fields: {basePath, name: *, host, produces, description, schemes, title: *, version: *}}}}
 */
const openApiProcessor = (name, spec, basePath) => {
    const rootId = `spec.${name}`
    const paths = []
    const responses = []
    const requestBodySchemas = []

    Object.keys(spec.paths).forEach((p) => {
        Object.keys(spec.paths[p]).forEach((v) => {
            const path = spec.paths[p][v]
            const pathResponses = Object.keys(path.responses).map((code) => {
                const response = path.responses[code]
                const example =
                    (response.content && response.content['application/json'].example) || {}
                return {
                    id: `${rootId}.path.${p}.verb.${v}.response.${code}`,
                    parent: `${rootId}.path.${p}.verb.${v}`,
                    children: [],
                    fields: {
                        statusCode: code,
                        description: response.description,
                        example: JSON.stringify(example, null, 2)
                    }
                }
            })

            pathResponses.forEach((r) => {
                responses.push(r)
            })

            let pathRequestBodySchemas = []
            if (path.requestBody) {
                pathRequestBodySchemas =
                    path.requestBody &&
                    Object.keys(path.requestBody.content)
                        .map((contentType) => {
                            const content = path.requestBody.content[contentType]
                            const {
                                schema: {required, properties},
                                example = {}
                            } = content
                            const flattenProperties = []

                            for (const [name, details] of Object.entries(properties)) {
                                // need to stringify values that are not string as GraphQL schema can't accept mixed types
                                const parsedDetails = {}
                                Object.keys(details).forEach((key) => {
                                    if (typeof details[key] === 'object') {
                                        parsedDetails[key] = JSON.stringify(details[key])
                                    } else {
                                        parsedDetails[key] = details[key]
                                    }
                                })
                                flattenProperties.push({name, ...parsedDetails})
                            }
                            return {
                                id: `${rootId}.path.${p}.verb.${v}.requestBody.content.${contentType}.schema`,
                                parent: `${rootId}.path.${p}.verb.${v}`,
                                children: [],
                                fields: {
                                    contentType,
                                    required,
                                    properties: flattenProperties,
                                    example: JSON.stringify(example, null, 2)
                                }
                            }
                        })
                        .filter(Boolean)

                pathRequestBodySchemas.forEach((r) => {
                    requestBodySchemas.push(r)
                })
            }

            let xfields = {}

            // copy x-* extension properties
            for (let key in path) {
                if (key.startsWith('x-')) {
                    // convert snake-case to snake_case
                    const snake_case = key.replace(/-/g, '_')
                    xfields[snake_case] = path[key]
                }
            }

            paths.push({
                id: `${rootId}.path.${p}.verb.${v}`,
                parent: rootId,
                children: [
                    ...pathResponses.map((pr) => pr.id),
                    ...pathRequestBodySchemas.map((pr) => pr.id)
                ],
                fields: Object.assign(
                    {
                        name: p,
                        verb: v,
                        summary: path.summary,
                        description: path.description,
                        parameters: path.parameters,
                        tags: path.tags,
                        tag: path.tags ? path.tags.join(',') : null,
                        operationId: path.operationId,
                        fullPath: basePath + p,
                        consumes: path.consumes,
                        produces: path.produces,
                        schemes: path.schemes,
                        deprecated: path.deprecated
                    },
                    xfields
                )
            })
        })
    })

    const information = {
        id: rootId,
        parent: null,
        children: [...paths.map((p) => p.id)],
        fields: {
            name,
            version: spec.info.version,
            title: spec.info.title,
            description: spec.info.description,
            host: spec.host,
            schemes: spec.schemes,
            basePath: basePath,
            produces: spec.produces
        }
    }

    return {
        information,
        paths,
        responses,
        requestBodySchemas
    }
}

module.exports = openApiProcessor
