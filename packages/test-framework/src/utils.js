/* eslint import/no-commonjs:0 no-useless-escape:0*/

const path = require('path')

const findNodeModules = (start) => {
    const inner = (p) => {
        if (path.dirname(p) === p) {
            // root
            throw new Error('Cannot find node modules directory')
        } else {
            return path.basename(p) === 'node_modules' ? p : inner(path.dirname(p))
        }
    }
    return inner(start)
}

module.exports = {findNodeModules}
