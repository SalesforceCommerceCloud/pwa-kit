const webpackConfig = require('pwa-kit-build/configs/webpack/config')

const fs = require ('fs')
const path = require('path')

const projectDir = process.cwd()
const sdkDir = path.resolve(path.join(__dirname, '..', '..', '..'))

console.log('COFFEEE')

const findInProjectThenSDK = (pkg) => {
    const projectPath = path.resolve(projectDir, 'node_modules', pkg)
    return fs.existsSync(projectPath) ? projectPath : path.resolve(sdkDir, 'node_modules', pkg)
}

const updated = webpackConfig.map((config) => {
    config.resolve.extensions.push(".coffee")
    config.module.rules.push(
      {
        test: /\.coffee$/,
        loader: findInProjectThenSDK("coffee-loader"),
        options: {
          bare: false
        },
      },
    )
    return config
})

module.exports = updated
