const webpackConfig = require('pwa-kit-build/configs/webpack/config')

const fs = require ('fs')
const path = require('path')

const projectDir = process.cwd()
const sdkDir = path.resolve(path.join(__dirname, '..', '..', '..'))

const findInProjectThenSDK = (pkg) => {
    const projectPath = path.resolve(projectDir, 'node_modules', pkg)
    return fs.existsSync(projectPath) ? projectPath : path.resolve(sdkDir, 'node_modules', pkg)
}

const updated = webpackConfig.map((config) => {
    config.resolve.extensions.push(".css")
    config.module.rules.push({
        test: /\.css$/i,
        use: [findInProjectThenSDK('isomorphic-style-loader'), findInProjectThenSDK('css-loader')]
    })
    return config
})

module.exports = updated
