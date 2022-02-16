const webpackConfig = require('pwa-kit-build/configs/webpack/config')

const fs = require ('fs')
const path = require('path')

const projectDir = process.cwd()
const sdkDir = path.resolve(path.join(__dirname, '..', '..', '..'))

const findInProjectThenSDK = (pkg) => {
    const projectPath = path.resolve(projectDir, 'node_modules', pkg)
    return fs.existsSync(projectPath) ? projectPath : path.resolve(sdkDir, 'node_modules', pkg)
}

console.log("in custom webpack")

const [client, ssr, renderer, clientOptional, requestProcessor] = webpackConfig

client.resolve.extensions.push(".css")

client.module.rules.push({
    test: /\.css$/i,
    use: [findInProjectThenSDK('style-loader'), findInProjectThenSDK('css-loader')]
})

renderer.resolve.extensions.push(".css")

renderer.module.rules.push({
    test: /\.css$/i,
    use: [findInProjectThenSDK('style-loader'), findInProjectThenSDK('css-loader')]
})

// console.log(client)

// for (rule of client.module.rules) {
//     console.log(rule)
// }

// console.log(ssr)

// for (rule of ssr.module.rules) {
//     console.log(rule)
// }


module.exports = [client, ssr, renderer, clientOptional, requestProcessor]
