/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Plugin configuration for the PWA Kit
 * This file defines the available plugins during the creation of a new PWA Kit project.
 * The elements in the plugins object should be consistent with the plugins defined in the webpack config in the @salesforce/pwa-kit-dev package.
 * All plugins should start with SFDC_EXT_, so that it's clear that they are extensions and not part of the core PWA Kit.
 */

module.exports = {
    plugins: {
        // SFDC_EXT_HELLO_WORLD_ENABLED: {
        //     description: 'The Hello World Extension'
        // },
    }
}
