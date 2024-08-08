// NOTE: This loader should only be applied when in develop mode, and there should be a cli option to opt out.
module.exports = function (source) {
    let {projectDir} = this.getOptions()

    if (process.env.NODE_ENV === 'production') {
        projectDir = '.'
    }
    // NOTE: Look at replacing this with NormalModuleReplacement if possible.
    source = source.replace(
        /const Extensions = {}/, 
        `var Extensions = require('${projectDir}/build/extensions').default`
    )

    return source
}