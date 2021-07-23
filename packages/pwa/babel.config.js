module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 12
                }
            }
        ],
        '@babel/preset-react'
    ],
    plugins: [
        '@babel/plugin-transform-async-to-generator',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-transform-object-assign',
        [
            '@babel/plugin-transform-runtime',
            {
                regenerator: true
            }
        ],
        '@babel/syntax-dynamic-import',
        '@loadable/babel-plugin',
        '@babel/plugin-proposal-optional-chaining',
        [
            'formatjs',
            {
                idInterpolationPattern: '[sha512:contenthash:base64:6]',
                ast: true
            }
        ]
    ],
    env: {
        test: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['dynamic-import-node-babel-7']
        }
    }
}
