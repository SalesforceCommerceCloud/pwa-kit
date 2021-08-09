/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        es6: true,
        node: true,
        browser: true,
        jest: true
    },
    extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier', 'prettier/react'],
    plugins: ['header', 'react', 'prettier'],
    settings: {
        react: {
            version: '16.8'
        }
    },
    rules: {
        'header/header': [
            2,
            'block',
            [
                ' * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *',
                {
                    pattern:
                        '^ \\* Copyright \\(c\\) \\d{4} Mobify Research & Development Inc\\. All rights reserved\\. \\*$',
                    template:
                        ' * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *'
                },
                ' * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * '
            ]
        ],
        'prettier/prettier': ['error'],
        'no-console': 'off',
        'no-unused-vars': ['error', {ignoreRestSiblings: true}]
    }
}
