const config = require('pwa-kit-dev/configs/webpack/config')

// This is a demo to override splitChunks
// to have more fine grain control over code splitting
// config is an array and the first element is the client config
// here we override the split chunks to split out the react/react-dom
// packages from vendor.js
config[0].optimization.splitChunks = {
    cacheGroups: {
        react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 1,
        },
        vendor: {
            test: /node_modules/,
            name: 'vendor',
            chunks: 'all',
        },
    },
}

module.exports = config
