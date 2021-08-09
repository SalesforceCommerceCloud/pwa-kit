/* eslint import/no-commonjs:0  */

/**
 * Rewrite imports in renamed packages, eg. import x from 'foo/thing' -> import x from 'bar/thing'
 *
 * Takes renames as an object mapping original name -> new name, passed as JSON
 * on the command line.
 */
const transform = (fileInfo, api, options) => {
    const j = api.jscodeshift
    const renames = options.renames

    if (!renames) {
        return fileInfo.source
    }

    return j(fileInfo.source)
        .find(j.ImportDeclaration)
        .forEach((node) => {
            for (const mod in renames) {
                if (renames.hasOwnProperty(mod) && node.value.source.value.startsWith(mod)) {
                    node.value.source.value = node.value.source.value.replace(mod, renames[mod])
                    break
                }
            }
        })
        .toSource({quote: 'single'})
}

module.exports = transform
