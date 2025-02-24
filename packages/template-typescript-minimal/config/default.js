/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires

// TODO: The extension-chakra-storefront/src/pages/index.tsx file uses import statements, which are not supported in CommonJS.
async function loadModule(path) {
    return await import(path);
    // console.log(myModule);
  }
  
const Pages = loadModule('@salesforce/extension-chakra-storefront/src/pages/index.tsx')

// const gettingStarted = loadModule('../app/pages/getting-started.tsx');

module.exports = {
    app: {
      extensions: [
        ["@salesforce/extension-chakra-storefront", {
          enabled: true,
          url: {
              site: "none",
              locale: "none"
          }}],
        ["@salesforce/extension-seo-url-mapping", {
            enabled: true,
            test: 'yesss',
            componentMap: Pages,
            resourceTypeToComponentMap: {
                category: Pages.ProductList,
                product: Pages.ProductDetail,
            }
        }]
      ]
    },
    ssrEnabled: true,
    ssrOnly: [
      "ssr.js",
      "ssr.js.map",
      "node_modules/**/*.*"
    ],
    ssrShared: [
      "static/favicon.ico",
      "static/robots.txt",
      "**/*.js",
      "**/*.js.map",
      "**/*.json"
    ],
    ssrParameters: {
      ssrFunctionNodeVersion: "20.x",
      proxyConfigs: [
        {
          host: "kv7kzm78.api.commercecloud.salesforce.com",
          path: "api"
        },
        {
          host: "zzrf-001.dx.commercecloud.salesforce.com",
          path: "ocapi"
        }
      ]
    }
}