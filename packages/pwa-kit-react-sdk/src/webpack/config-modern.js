import fs from 'fs';
import p from 'path';
import {createModuleReplacementPlugin} from './plugins';
import resolveFrom from 'resolve-from';
import webpack from "webpack";
import LoadablePlugin from "@loadable/webpack-plugin";
import CopyPlugin from "copy-webpack-plugin"

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const pkg = p.resolve(p.join(__dirname, '..', '..'))
const rf = (path) => resolveFrom(p.resolve(pkg, 'node_modules'), path)

const context = process.cwd()

const replacements = [
    {
        path: p.join('ssr', 'universal', 'components', '_app-config'),
        newPath: p.join('app', 'components', '_app-config', 'index')
    },
    {
        path: p.join('ssr', 'universal', 'components', '_document'),
        newPath: p.join('app', 'components', '_document', 'index')
    },
    {
        path: p.join('ssr', 'universal', 'components', '_app'),
        newPath: p.join('app', 'components', '_app', 'index')
    },
    {
        path: p.join('ssr', 'universal', 'components', '_error'),
        newPath: p.join('app', 'components', '_error', 'index')
    },
    {
        path: p.join('ssr', 'universal', 'routes'),
        newPath: p.join('app', 'routes')
    }
]

const allReplacements = []

replacements.forEach(({path, newPath}) => {
    ['dist', 'src'].forEach((prefix) => {
        const prefixedPath = p.join('common-runtime', prefix, path)
        const extensions = ['.jsx', '.tsx'];
        for (let i = 0; i < extensions.length; i++) {
          const extension = extensions[i];
          const withExtension = p.resolve(context, `${newPath}${extension}`);
          if (fs.existsSync(withExtension)) {
            allReplacements.push(({path: prefixedPath, newPath: withExtension}))
          }
        }
    });
})

const moduleReplacementPlugin = createModuleReplacementPlugin({replacements: allReplacements})

const babelLoaderCommon = {
    plugins: [
        rf('@babel/plugin-transform-async-to-generator'),
        rf('@babel/plugin-proposal-object-rest-spread'),
        rf('@babel/plugin-transform-object-assign'),
        [
            rf('@babel/plugin-transform-runtime'),
            {
                regenerator: true
            }
        ],
        rf('@babel/plugin-syntax-dynamic-import'),
        rf('@loadable/babel-plugin'),
        rf('@babel/plugin-proposal-optional-chaining'),
        [
            rf('babel-plugin-formatjs'),
            {
                idInterpolationPattern: '[sha512:contenthash:base64:6]',
                ast: true
            }
        ]
    ],
    env: {
        test: {
            presets: [rf('@babel/preset-env'), rf('@babel/preset-react')],
            plugins: [rf('babel-plugin-dynamic-import-node-babel-7')]
        }
    }
}


const common = {
    mode,
    context,
    stats: {
        all: false,
        modules: false,
        errors: true,
        warnings: true,
        moduleTrace: true,
        errorDetails: true,
        colors: true,
        assets: false,
        excludeAssets: [/.*img\/.*/, /.*svg\/.*/, /.*json\/.*/, /.*static\/.*/]
    },
    devtool: 'source-map',
    resolveLoader: {
        modules: [p.join(pkg, 'node_modules'), p.join(context, 'node_modules')],
        extensions: ['.js', '.json'],
        mainFields: ['loader', 'main'],
    },
    resolve: {
      extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
      alias: {
        "@babel/runtime": p.resolve(pkg, 'node_modules', '@babel', 'runtime'),
        react: p.resolve(context, 'node_modules', 'react'),
        'react-dom': p.resolve(context, 'node_modules', 'react-dom'),
      }
    },
    plugins: [
        moduleReplacementPlugin,
    ],
    module: {
        rules: [
            {
                test: /(\.m?jsx?$)/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            [
                                rf("@babel/preset-env"),
                                {
                                    targets: {
                                        node: 12
                                    }
                                },
                            ],
                            rf('@babel/preset-react')
                        ],
                        ...babelLoaderCommon,
                    }
                }
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            rf("@babel/preset-typescript"),
                            [
                                rf("@babel/preset-env"),
                                {
                                    targets: {
                                        node: 12
                                    }
                                },
                            ],
                            rf('@babel/preset-react')
                        ],
                        ...babelLoaderCommon
                    }
                }
            }
        ]
    }
}

module.exports = [
    {
        ...common,
        name: 'client',
        entry: ['./app/main.jsx'],
        output: {
            publicPath: '',
            path: p.resolve(context, 'build'),
            filename: '[name].js',
            chunkFilename: '[name].js' // Support chunking with @loadable/components
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        // Anything imported from node_modules lands in vendor.js
                        test: /node_modules/,
                        name: 'vendor',
                        chunks: 'all'
                    }
                }
            }
        },
        performance: {
            maxEntrypointSize: 905000,
            maxAssetSize: 825000
        },
        plugins: [
            ...common.plugins,
            new LoadablePlugin({writeToDisk: true}),
            new CopyPlugin({
                patterns: [
                    { from: "./app/static", to: "static" }
                ]
            })
        ],
        target: 'web',
    },
    {
        ...common,
        name: 'server',
        entry: ['./app/server-renderer.jsx'],
        output: {path: p.resolve(context, 'build'),
            filename: './server-renderer.js',
            libraryTarget: 'commonjs2'
        },
        plugins: [
            ...common.plugins,
            new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1})
        ],
        target: 'node',
    }
]