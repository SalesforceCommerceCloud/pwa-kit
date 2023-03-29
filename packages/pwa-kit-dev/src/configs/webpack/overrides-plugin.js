const path = require('path')
const fs = require('fs')

class OverridesResolverPlugin {
    constructor(options) {
        this.options = options
        // construct the overrides map here
    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync('OverridesResolverPlugin', (requestContext, resolveContext, callback) => {
            console.log('requestContext', requestContext)
            console.log('resolveContext', resolveContext)

            if (requestContext.request.startsWith('^')) {
                //something in here to deal with ^
            } else if (requestContext.request.startsWith('.')) {
                //something in here to deal with RELATIVE IMPORTS
                //everything that does NOT come from node modules starts with a .
                //request with a . is not an external dependency
            }

            //TODO: overwrite just 1 file to get it to load
            // get these files to resolve and route correctly
            //findfile ==== our glob sync algorithm (_overridesmap)


            callback()
        })
    }
}

module.exports = OverridesResolverPlugin