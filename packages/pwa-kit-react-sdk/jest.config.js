const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    collectCoverageFrom: [
        '**/*.{js,jsx}',
        '!**/test.{js,jsx}',
        '!generator-assets/**/*.{js,jsx}',
        '!coverage/**/*.js',
        '!dist/**/*.{js,jsx}',
        '!docs/**/*.{js,jsx}',
        '!vendor/**/*',
        '!*.config.js',
        '!scripts/{setup-jsdom,console-output}.js',
        '!src/utils/{testing,cookie-manager}.js',
        '!src/index.js',
        '!src/{polyfill,test-utils,load-scripts}.js',
        '!jest-babel-transform.js',
        '!src/integration-manager/index.js',
        '!src/integration-manager/types.js',
        '!src/integration-manager/results.js',
        '!src/integration-manager/commands.js',
        '!src/integration-manager/reducer.js',
        '!src/integration-manager/*/{commands,results,types}.js',
        '!bin/*.js',
        '!src/patterns/**/*.{js,jsx}',
        '!src/templates/**/*.{js,jsx}',
        '!src/ssr/ssr-polyfills.js',
        '!src/ssr/server/test_fixtures/*.{js,jsx}',
        '!src/worker/{main,test-entrypoint}.js',
        '!temp/**/*',
        '!temp_static/**/*',
        '!src/static/*',
        '!tests/*.js',
        '!src/webpack/**/*'
    ],
    coverageThreshold: {
        global: {
            branches: 94,
            functions: 87,
            lines: 90,
            statements: 90
        }
    },
}