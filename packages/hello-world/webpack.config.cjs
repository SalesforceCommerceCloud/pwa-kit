// https://github.com/mobify/echo-poc/blob/main/webpack.config.js
const path = require('path')

module.exports = {
    entry: {
        ssr: './ssr.js',
        loader: './loader.js'
    },
    target: 'node',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2'
    }
}