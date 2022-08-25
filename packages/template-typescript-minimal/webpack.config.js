const config = require('pwa-kit-dev/configs/webpack/config')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

config.forEach((c) => {
    c.module.rules.push({
        test: /\.(sa|sc|c)ss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
    })
    c.plugins.push(new MiniCssExtractPlugin({filename: '[name].css'}))
})

module.exports = config
