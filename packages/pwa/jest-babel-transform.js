// Allows us to use a single babel config at the root to be shared across
// packages. See: https://babeljs.io/docs/en/config-files#jest

/* eslint-env node */

const babelJest = require('babel-jest')

module.exports = babelJest.createTransformer({
    rootMode: 'upward'
})
