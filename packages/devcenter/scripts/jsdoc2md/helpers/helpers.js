/* eslint import/no-commonjs:0 */
/* eslint-env node */

/**
 * Return a Markdown link (eg. "[name](url)") for a Javascript type parsed by JSDoc.
 *
 * Types can be JS primitives ("String", "Array", etc.) or types that we have defined
 * in our own code (eg. "module:@mobify/commerce-integrations/dist/types.Email").
 *
 * For any type we have defined, we generate a deep link to its location on the docs
 * site. This is possible because the location is predictable - it is always
 * of the form:
 *
 *    "/path/to/the/module#full-id-of-the-symbol."
 *
 * Taking "module:@mobify/commerce-integrations/dist/types.Payment" as a specifc
 * example, the URL should be:
 *
 *     "/@mobify/commerce-integrations/types#module:@mobify/commerce-integrations/dist/types.Payment"
 *
 * @param {String} type
 * @return {String}
 */
exports.createLink = (type) => {
    if (typeof type !== 'string') return null
    let ret
    // Normalize the type string so that any of our own types are consistently
    // of the form eg. "module:@mobify/commerce-integrations/dist/types.Payment"
    type = type.startsWith('#module_') ? type.replace('#module_', 'module:') : type

    if (/module:/.test(type)) {
        // look for string type inside Promise<> or Promise<Array<>> or Array<> to create link
        if (/((Promise.<[^module:]*)|(Array.<?[^module:]*))(.*)(>)/.test(type)) {
            // using reqexp to slit the type into certain groups
            const groups = type.match(/((Promise.<[^module:]*)|(Array.<?[^module:]*))([^>]*)(>>?)/)
            ret = `${groups[1]}${createUrl(groups[4])}${groups[5]}`
        } else {
            ret = createUrl(type)
        }
    } else {
        // This is a Javascript builtin like "String". We do not generate a link
        // to docs for builtins, so return the original type name, unmodified.
        ret = type
    }
    return ret
}

exports.cleanModuleName = (moduleName) => {
    const split = moduleName.split('/')

    // This is a namespaced package - drop the namespace
    if (split[0].startsWith('@')) {
        split.shift()
    }

    // For historical reasons, module names are prefixed with 'dist' which
    // we also don't want to appear in our page structure.
    if (split[1] === 'dist') {
        split.splice(1, 1)
    }

    return split.join('/')
}

const createUrl = (type) => {
    const unprefixed = type.replace('module:', '')

    const [module, identifier] = unprefixed.split('.')

    let name = ''
    // if the types does not include any identifier, take the last element in module name as identifer
    if (!identifier) {
        const parts = unprefixed.split('/').slice(-1)
        name = parts[parts.length - 1]
    } else {
        name = identifier
    }
    const cleaned = exports.cleanModuleName(module)
    const url = `/apis-and-sdks/${cleaned}#${exports.fragmentIdentifier(type)}`
    return `[${name}](${url})`
}

/**
 * Generate a short, readable name for any symbol in the parsed JSDoc data.
 *
 * @param {Object} node - the parsed data for a symbol, as return from JSDoc.
 * @return {String}
 */
exports.formatName = (node) => {
    const {name, kind, scope} = node
    // if (name === 'fromConfig') {
    //     throw new Error(JSON.stringify(symbol, null, 4))
    // }

    let ret

    if (kind === 'module') {
        ret = name
    } else if (kind === 'constructor') {
        // remove the wording 'exports.' parsed by jsdoc-to-markdown
        ret = name.replace('exports.', '')
    } else if (kind === 'typedef') {
        ret = name
    } else {
        ret = `${name}`
    }
    return ret
}

/**
 * Convert a JSDoc symbol identifier to a string that is safe to use as the id
 * attribute of an element in markdown that preserves the uniqueness of the
 * identifier (eg. swaps "@" for "-at-" rather than mangling the characters).
 *
 * @param {String} id
 * @return {String}
 */
exports.fragmentIdentifier = (id) => {
    const ret = id
        .replace(/\./g, '-dot-')
        .replace(/:/g, '-colon-')
        .replace(/\//g, '-slash-')
        .replace(/#/g, '-hash-')
        .replace(/\+/g, '-plus-')
        .replace(/~/g, '-tilde-')
        .replace(/@/g, '-at-')
        .replace(/\(/g, '-lparen-')
        .replace(/\)/g, '-rparen-')

    // console.log(`fragmentIdentifier("${id}") => "${ret}"`)
    return ret
}

/**
 * Convert a JSDoc symbol identifier to the markdown tag needed to set the id
 * on a heading. This is awkard in the handlebars template because the tag needs
 * "{" and "}" characters with exact white spacing.
 *
 * An example setting a custom heading id:
 *
 *     ### My heading {#this-is-the-id}
 *
 * @param id
 * @return {string}
 */
exports.markdownHeadingIdentifier = (id) => {
    return `{#${exports.fragmentIdentifier(id)}}`
}

/**
 * Get the module name from JSDOC memberof tag of current node
 * @param moduleName
 * @returns {string|null}
 */
exports.getModuleName = (moduleName) => {
    if (typeof moduleName !== 'string') return null
    return moduleName.replace(/module:/g, '')
}

/**
 * Check if current class has a constructor
 * @param {array} data - all the parsed data
 * @param {object} node - the parsed data for a symbol, as return from JSDoc.
 * @returns {boolean}
 */
exports.hasConstructor = (data, node) => {
    const {longname} = node
    return data.some((x) => x.memberof === longname && x.kind === 'constructor')
}

/**
 * Check if current class has a constructor
 * @param {array} data - all the parsed data
 * @param {object} node - the parsed data for a symbol, as return from JSDoc.
 * @returns {boolean}
 */
exports.hasMethod = (data, node) => {
    const {longname} = node
    return data.some(
        (x) => x.memberof === longname && x.kind === 'function' && x.scope === 'instance'
    )
}

exports.headingDepth = function headingDepth(options) {
    return options.data.root.options._depth + options.data.root.options['heading-depth'] - 1
}

/**
 * Construct import statement for functions, constant and class
 * @param {Object} node - the parsed data for a symbol, as returned from JSDoc
 *
 * @returns {String}
 */
exports.getImportStatement = (node, data) => {
    const {kind, scope, name, memberof} = node

    // a flag to check if the static function node belongs to a class or a module
    // static function in class will not have import statement
    let isInClass = false
    if (kind === 'function' && scope === 'static') {
        const parent = data.filter((x) => x.id === memberof && x.kind === 'class')

        if (parent.length) {
            isInClass = true
        }
    }

    if (
        (kind === 'class' && scope === 'static') ||
        (kind === 'function' && scope === 'static' && !isInClass) ||
        kind === 'constant'
    ) {
        return [
            '```javascript title=Import',
            `import { ${name} } from '${exports.getModuleName(memberof)}`,
            '```'
        ].join('\n')
    }

    if (kind === 'class' && scope === 'inner') {
        return [
            '```javascript title=Import',
            `import ${name} from '${exports.getModuleName(memberof)}`,
            '```'
        ].join('\n')
    }

    return null
}

exports.escapeUnsafeSyntax = (string) => {
    if (typeof string !== 'string') return null
    return string.replace('<', '&lt;').replace('>', '&gt;')
}
