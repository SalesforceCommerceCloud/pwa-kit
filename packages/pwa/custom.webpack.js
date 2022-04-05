// Use this file to extend existing webpack config in pwa-kit-build\src\configs\webpack\config.js

const path = require('path')

const projectDir = process.cwd()

module.exports = {}

/** module.exports = {
    resolve: {
        alias: {
            commerceAPIAlias: path.join(projectDir, './app/commerce-api'),
            hooksAlias: path.join(projectDir, './app/hooks'),
        }
    }
}*/