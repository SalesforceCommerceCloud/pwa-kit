// Script: generate-page-metadata.js
// Requires: npm install @babel/parser @babel/traverse

const fs = require('fs')
const path = require('path')
const babelParser = require('@babel/parser')
const traverse = require('@babel/traverse').default

const ROUTE_FILE = path.resolve(__dirname, '../../app/routes.jsx')
const PAGES_BASE_DIR = path.resolve(__dirname, '../../app')
const OUTPUT_DIR = path.resolve(__dirname, './page-jsons')

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, {recursive: true})
}

const routeContent = fs.readFileSync(ROUTE_FILE, 'utf-8')
const ast = babelParser.parse(routeContent, {
    sourceType: 'module',
    plugins: ['jsx']
})

// Step 1: Extract constants
const constants = {}
traverse(ast, {
    ImportDeclaration({node}) {
        if (node.source.value.endsWith('/constants')) {
            node.specifiers.forEach((spec) => {
                constants[spec.local.name] = null // We'll fill these in below
            })
        }
    },
    VariableDeclarator({node}) {
        if (node.id && node.init && node.init.type === 'StringLiteral') {
            constants[node.id.name] = node.init.value
        }
    }
})

// Step 2: Extract component import map
const componentMap = {}
traverse(ast, {
    VariableDeclarator({node}) {
        if (
            node.init &&
            node.init.type === 'CallExpression' &&
            node.init.callee.name === 'loadable'
        ) {
            const arg = node.init.arguments[0]
            if (
                arg &&
                arg.type === 'ArrowFunctionExpression' &&
                arg.body.type === 'CallExpression' &&
                arg.body.callee.type === 'Import'
            ) {
                const importPath = arg.body.arguments[0].value
                componentMap[node.id.name] = importPath
            }
        }
    }
})

// Step 3: Extract routes array
let routesArray = []
traverse(ast, {
    ExportNamedDeclaration({node}) {
        if (node.declaration && node.declaration.type === 'VariableDeclaration') {
            node.declaration.declarations.forEach((decl) => {
                if (decl.id.name === 'routes' && decl.init.type === 'ArrayExpression') {
                    routesArray = decl.init.elements
                }
            })
        }
    }
})

// Step 4: Process each route
routesArray.forEach((routeNode) => {
    if (!routeNode || routeNode.type !== 'ObjectExpression') return

    let pathValue = null
    let componentName = null

    routeNode.properties.forEach((prop) => {
        if (prop.key.name === 'path') {
            if (prop.value.type === 'StringLiteral') {
                pathValue = prop.value.value
            } else if (prop.value.type === 'Identifier') {
                // Try to resolve constant
                pathValue = constants[prop.value.name] || prop.value.name
            } else if (prop.value.type === 'LogicalExpression') {
                // Handles: socialRedirectURI || '/social-callback'
                if (prop.value.right.type === 'StringLiteral') {
                    pathValue = prop.value.right.value
                }
            }
        }
        if (prop.key.name === 'component') {
            if (prop.value.type === 'Identifier') {
                componentName = prop.value.name
            }
        }
    })

    if (!pathValue || !componentName) return

    const importPath = componentMap[componentName]
    if (!importPath) {
        console.warn(`⚠ No import path for component: ${componentName}`)
        return
    }

    // Try both importPath.jsx and importPath/index.jsx
    let filePath = path.join(PAGES_BASE_DIR, importPath + '.jsx')
    if (!fs.existsSync(filePath)) {
        filePath = path.join(PAGES_BASE_DIR, importPath, 'index.jsx')
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠ Component file not found: ${filePath}`)
            return
        }
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const pageAst = babelParser.parse(fileContent, {
        sourceType: 'module',
        plugins: ['jsx']
    })

    let templateName = componentName.toLowerCase()
    let mainComponentName = null
    traverse(pageAst, {
        ExportDefaultDeclaration(path) {
            if (path.node.declaration.type === 'Identifier') {
                mainComponentName = path.node.declaration.name
            }
        }
    })

    let rootJsx = null
    if (mainComponentName) {
        traverse(pageAst, {
            FunctionDeclaration(path) {
                if (path.node.id && path.node.id.name === mainComponentName) {
                    path.traverse({
                        ReturnStatement(returnPath) {
                            if (!rootJsx) {
                                rootJsx = extractJsx(returnPath.node.argument)
                            }
                        }
                    })
                }
            },
            VariableDeclarator(path) {
                if (
                    path.node.id.name === mainComponentName &&
                    (path.node.init.type === 'ArrowFunctionExpression' ||
                        path.node.init.type === 'FunctionExpression')
                ) {
                    path.get('init').traverse({
                        ReturnStatement(returnPath) {
                            if (!rootJsx) {
                                rootJsx = extractJsx(returnPath.node.argument)
                            }
                        }
                    })
                }
            }
        })
    }

    let structure = []
    if (rootJsx) {
        const root = convertJsxToStructure(rootJsx)
        if (root) structure = [root]
    }

    const output = {
        template: templateName,
        path: pathValue,
        componentPath: importPath,
        structure
    }

    const filename = `${templateName}.json`
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(output, null, 2))
    console.log(`✔ Wrote (or overwrote) ${filename}`)
})

// --- Helper functions ---
function extractJsx(node) {
    if (!node) return null
    if (node.type === 'JSXElement') return node
    if (node.type === 'ParenthesizedExpression') return extractJsx(node.expression)
    if (node.type === 'ConditionalExpression')
        return extractJsx(node.consequent) || extractJsx(node.alternate)
    if (node.type === 'JSXFragment') return {type: 'JSXFragment', children: node.children}
    return null
}

function convertJsxToStructure(node) {
    if (!node) return null
    if (node.type === 'JSXElement') {
        const type = node.openingElement.name.name || 'Unknown'
        const props = {}
        node.openingElement.attributes.forEach((attr) => {
            if (attr.type === 'JSXAttribute') {
                const propName = attr.name.name
                if (!attr.value) {
                    // Boolean prop (e.g., <Box fluid />)
                    props[propName] = true
                } else if (attr.value.type === 'StringLiteral') {
                    props[propName] = attr.value.value
                } else if (attr.value.type === 'JSXExpressionContainer') {
                    props[propName] = extractExpressionValue(attr.value.expression)
                }
            } else if (attr.type === 'JSXSpreadAttribute') {
                props['...'] = '<spread>' // Mark spread attributes
            }
        })
        const children = node.children.map((child) => convertJsxToStructure(child)).filter(Boolean)
        return {
            type,
            ...(Object.keys(props).length > 0 ? {props} : {}),
            ...(children.length > 0 ? {children} : {})
        }
    }
    if (node.type === 'JSXFragment') {
        const children = node.children.map((child) => convertJsxToStructure(child)).filter(Boolean)
        return {
            type: 'Fragment',
            ...(children.length > 0 ? {children} : {})
        }
    }
    // Ignore everything else (text, expressions, etc.)
    return null
}

function extractExpressionValue(expr) {
    if (!expr) return null
    if (expr.type === 'StringLiteral') return expr.value
    if (expr.type === 'NumericLiteral') return expr.value
    if (expr.type === 'BooleanLiteral') return expr.value
    if (expr.type === 'ObjectExpression') {
        const obj = {}
        expr.properties.forEach((prop) => {
            if (prop.type === 'ObjectProperty') {
                const key = prop.key.name || (prop.key.value !== undefined ? prop.key.value : '')
                obj[key] = extractExpressionValue(prop.value)
            }
        })
        return obj
    }
    if (expr.type === 'ArrayExpression') {
        return expr.elements.map((el) => extractExpressionValue(el))
    }
    if (expr.type === 'Identifier') {
        return {type: 'identifier', name: expr.name}
    }
    if (expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression') {
        return '<function>'
    }
    if (expr.type === 'JSXElement') {
        return convertJsxToStructure(expr)
    }
    if (expr.type === 'JSXFragment') {
        return convertJsxToStructure(expr)
    }
    // For other expressions, just mark as expression
    return '<expression>'
}
