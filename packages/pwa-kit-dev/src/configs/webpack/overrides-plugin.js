const path = require('path')
const fs = require('fs')

class OverridesResolverPlugin {
    constructor(options) {
        this.options = options
        // construct the overrides map here
        console.log('options', options)
    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync('OverridesResolverPlugin', (requestContext, resolveContext, callback) => {
            console.log('requestContext', requestContext)
            console.log('resolveContext', resolveContext)


            callback()
        })
    }
}

module.exports = OverridesResolverPlugin