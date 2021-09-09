const path = require('path')

module.exports = {
    entry: {
        ssr: './src/ssr.js',
        loader: './src/loader.js'
    },
    target: 'node',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2'
    }
}
