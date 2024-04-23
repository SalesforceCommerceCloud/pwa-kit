/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
  RETAIL_APP_HOME:
    process.env.RETAIL_APP_HOME ||
    "https://scaffold-pwa-e2e-tests-pwa-kit.mobify-storefront.com",
  GENERATED_PROJECTS_DIR: "../generated-projects",
  GENERATE_PROJECTS: ["retail-app-demo", "retail-app-ext", "retail-app-no-ext"],
  GENERATOR_CMD:
    "node packages/pwa-kit-create-app/scripts/create-mobify-app-dev.js --outputDir",
  CLI_RESPONSES: {
    "retail-app-demo": [
      {
        expectedPrompt: /Choose a project preset to get started:/i,
        response: "2\n",
      },
    ],
    "retail-app-ext": [
      {
        expectedPrompt: /Choose a project preset to get started:/i,
        response: "1\n",
      },
      {
        expectedPrompt: /Do you wish to use template extensibility?/i,
        response: "2\n",
      },
      {
        expectedPrompt: /What is the name of your Project?/i,
        response: "scaffold-pwa\n",
      },
      {
        expectedPrompt: /What is the URL for your Commerce Cloud instance?/i,
        response: "https://zzrf-002.dx.commercecloud.salesforce.com\n",
      },
      {
        expectedPrompt: /What is your SLAS Client ID?/i,
        response: "987fc116-d30c-4537-93cb-c2bd433c3b5a\n",
      },
      {
        expectedPrompt: /Is your SLAS client private?/i,
        response: "2\n",
      },
      {
        expectedPrompt: /What is your Site ID in Business Manager?/i,
        response: "RefArch\n",
      },
      {
        expectedPrompt:
          /What is your Commerce API organization ID in Business Manager?/i,
        response: "f_ecom_zzrf_002\n",
      },
      {
        expectedPrompt:
          /What is your Commerce API short code in Business Manager?/i,
        response: "kv7kzm78\n",
      },
    ],
    "retail-app-no-ext": [
      {
        expectedPrompt: /Choose a project preset to get started:/i,
        response: "1\n",
      },
      {
        expectedPrompt: /Do you wish to use template extensibility?/i,
        response: "1\n",
      },
      {
        expectedPrompt: /What is the name of your Project?/i,
        response: "scaffold-pwa\n",
      },
      {
        expectedPrompt: /What is the URL for your Commerce Cloud instance?/i,
        response: "https://zzrf-002.dx.commercecloud.salesforce.com\n",
      },
      {
        expectedPrompt: /What is your SLAS Client ID?/i,
        response: "987fc116-d30c-4537-93cb-c2bd433c3b5a\n",
      },
      {
        expectedPrompt: /Is your SLAS client private?/i,
        response: "2\n",
      },
      {
        expectedPrompt: /What is your Site ID in Business Manager?/i,
        response: "RefArch\n",
      },
      {
        expectedPrompt:
          /What is your Commerce API organization ID in Business Manager?/i,
        response: "f_ecom_zzrf_002\n",
      },
      {
        expectedPrompt:
          /What is your Commerce API short code in Business Manager?/i,
        response: "kv7kzm78\n",
      },
    ],
    "retail-app-private-client": [],
  },
  PRESET: {
    "retail-app-private-client": "retail-react-app-private-slas-client",
  },
  EXPECTED_GENERATED_ARTIFACTS: {
    "retail-app-demo": [
      ".eslintignore",
      ".eslintrc.js",
      ".prettierrc.yaml",
      "babel.config.js",
      "config",
      "node_modules",
      "overrides",
      "package-lock.json",
      "package.json",
      "translations",
      "worker",
    ],
    "retail-app-ext": [
      ".eslintignore",
      ".eslintrc.js",
      ".prettierrc.yaml",
      "babel.config.js",
      "config",
      "node_modules",
      "overrides",
      "package-lock.json",
      "package.json",
      "translations",
      "worker",
    ],
    "retail-app-no-ext": [
      ".eslintignore",
      ".eslintrc.js",
      ".prettierignore",
      ".prettierrc.yaml",
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "app",
      "babel.config.js",
      "cache-hash-config.json",
      "config",
      "jest-setup.js",
      "jest.config.js",
      "jsconfig.json",
      "node_modules",
      "package-lock.json",
      "package.json",
      "scripts",
      "tests",
      "translations",
      "worker",
    ],
  },
};
