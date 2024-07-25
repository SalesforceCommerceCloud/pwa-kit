var path = require('path');
    var MiniCssExtractPlugin = require('mini-css-extract-plugin');
    var CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
    var RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
    var sgmfScripts = require('sgmf-scripts');

    module.exports = [{
        mode: 'production',
        name: 'js',
        entry: sgmfScripts.createJsPath(),
        output: {
            path: path.resolve('./cartridges/plugin_shopper_context/cartridge/static'),
            filename: '[name].js'
        }
    },
    {
        mode: 'none',
        name: 'scss',
        entry: sgmfScripts.createScssPath(),
        output: {
            path: path.resolve('./cartridges/plugin_shopper_context/cartridge/static')
        },
        plugins: [
            new RemoveEmptyScriptsPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[name].css'
            })
        ],
        module: {
            rules: [
                {
                    test: /.scss$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                esModule: false
                            }
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                url: false
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions : {
                                    plugins: [require('autoprefixer')]
                                }
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                implementation: require('sass'),
                                sassOptions: {
                                    includePaths: [
                                        path.resolve('node_modules'),
                                        path.resolve(
                                            'node_modules/flag-icon-css/sass'
                                        )
                                    ]
                                }
                            }
                        }
                    ]
                }
            ]
        },
        optimization: {
            minimizer: ['...', new CssMinimizerPlugin()]
        }
    }];
