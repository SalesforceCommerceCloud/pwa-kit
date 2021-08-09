const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

// We are import react-docgen, relying on the version depended on by react-styleguidist
const DocGen = require('react-docgen') // eslint-disable-line import/no-extraneous-dependencies

const ComponentsBaseCSS = new ExtractTextPlugin('css/components-base.css')
const StyleguideCSS = new ExtractTextPlugin('css/styleguide.css')

module.exports = {
    title: 'Progressive Web SDK',
    sections: [
        {
            name: 'Components',
            components: 'src/components/*/*.jsx'
        },
        {
            name: 'Templates',
            components: 'src/templates/*/*.jsx'
        },
        {
            name: 'Patterns',
            components: 'src/patterns/*/*.jsx'
        }
    ],
    ignore: [
        // Private components that were positioned incorrectly and are getting included
        // in the component docs... These aren't being moved so as to avoid breaking changes
        '**/nav-header-default-content.jsx',
        '**/non-expanded-items.jsx',
        '**/sheet-content.jsx',
        '**/tabs-strip.jsx',
        // Deprecated components to NOT include in docs...
        '**/form-fields/*',
        '**/with-push-messaging/*'
    ],
    serverHost: '0.0.0.0',
    serverPort: 9002,
    showCode: true,
    showUsage: true,
    skipComponentsWithoutExample: false,
    styleguideDir:
        process.env.ReactStyleguideOutputDir ||
        path.resolve('docs', 'public', 'latest', 'styleguidist'),
    resolver: DocGen.resolver.findAllComponentDefinitions,
    styleguideComponents: {
        ComponentsList: path.join(__dirname, 'styleguide/layout/ComponentsList'),
        PropsRenderer: path.join(__dirname, 'styleguide/layout/PropsRenderer'),
        StyleGuideRenderer: path.join(__dirname, 'styleguide/layout/StyleGuideRenderer'),
        TableOfContents: path.join(__dirname, 'styleguide/layout/TableOfContents')
    },
    theme: {
        color: {
            base: '#333',
            light: '#707070',
            lightest: '#ebebeb',
            link: '#005c83',
            linkHover: '#0288a7',
            border: '#d1d1d1', // roughly #ebebeb @ 10% darker
            name: '#333',
            type: '#005c83',
            error: '#b60000',
            baseBackground: '#fff',
            codeBackground: '#fff',
            sidebarBackground: '#fff'
        },
        fontFamily: {
            base: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'helvetica', 'sans-serif'],
            monospace: ['"consolas"', '"menlo"', 'monospace']
        },
        fontSize: {
            base: 16,
            text: 16,
            small: 12,
            h1: 34,
            h2: 24,
            h3: 18,
            h4: 18,
            h5: 16,
            h6: 16
        },
        mq: {
            small: '@media (max-width: 60em)'
        },
        borderRadius: '2px',
        maxWidth: 'calc(60em + 64px)'
    },
    webpackConfig: {
        module: {
            loaders: [
                // Babel loader will use your project’s .babelrc
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    include: __dirname,
                    loader: 'babel-loader',
                    query: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                },
                // Components Base styles
                {
                    test: /\.scss$/,
                    // PostCSS configuration for autoprefixer lives in postcss.config.js
                    // `?-autoprefixer required to non-destructively minify CSS`, see
                    // https://github.com/webpack/css-loader#minification
                    loader: ComponentsBaseCSS.extract([
                        'css-loader?-autoprefixer',
                        'postcss-loader',
                        'sass-loader'
                    ]),
                    exclude: /(node_module|styleguide)/,
                    include: __dirname
                },
                // Loader for styleguide styles
                {
                    test: /\.scss$/,
                    loader: StyleguideCSS.extract([
                        'css-loader?-autoprefixer',
                        'postcss-loader',
                        'sass-loader'
                    ]),
                    include: path.resolve(__dirname, 'styleguide')
                },
                {
                    test: /\.css$/,
                    loader: 'style!css?modules&importLoaders=1',
                    include: /styleguide/
                },
                // SVG Sprite - `npm install text-loader` (https://www.npmjs.com/package/text-loader)
                {
                    test: /\.svg$/,
                    include: /(styleguide\/svg|styleguide\\svg)/,
                    loader: 'text-loader'
                }
            ]
        },
        plugins: [ComponentsBaseCSS, StyleguideCSS]
    }
}
