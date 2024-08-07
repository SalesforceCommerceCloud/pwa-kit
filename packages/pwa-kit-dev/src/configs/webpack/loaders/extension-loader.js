// NOTE: This loader should only be applied when in develop mode, and there should be a cli option to opt out.
module.exports = function (source) {
    
    // NOTE: Look at replacing this with NormalModuleReplacement if possible.
    source = source.replace(
        /const Extensions = {}/, 
        `var Extensions = require('/Users/bchypak/Projects/pwa-kit/packages/template-typescript-minimal/app/extensions').default`
    )

    return source
}