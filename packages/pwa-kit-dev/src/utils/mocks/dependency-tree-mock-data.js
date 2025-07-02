/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const differentMajorVersions = {
    version: '0.0.1',
    name: 'test',
    dependencies: {
        '@salesforce/pwa-kit-react-sdk': {
            version: '9.0.0'
        }
    }
}

export const differentMinorVersions = {
    version: '0.0.1',
    name: 'test',
    dependencies: {
        '@salesforce/pwa-kit-react-sdk': {
            version: '1.10.0'
        }
    }
}

export const differentPatchVersions = {
    version: '0.0.1',
    name: 'test',
    dependencies: {
        '@salesforce/pwa-kit-react-sdk': {
            version: '1.0.9'
        }
    }
}

export const preReleaseVersion = {
    version: '0.0.1',
    name: 'test',
    dependencies: {
        '@salesforce/pwa-kit-react-sdk': {
            version: '1.0.0-beta'
        }
    }
}

export const dedupedVersion = {
    version: '0.0.1',
    name: 'test',
    dependencies: {
        '@salesforce/pwa-kit-react-sdk': {
            version: '1.0.0'
        }
    }
}

export const noPwaKitPackages = {
    version: '0.0.1',
    name: 'test'
}

export const includesPwaKitPackages = {
    version: '0.0.1',
    name: 'test',
    dependencies: {
        '@salesforce/pwa-kit-react-sdk': {
            version: '1.0.0'
        },
        '@salesforce/pwa-kit-runtime': {
            version: '1.0.0'
        },
        '@salesforce/pwa-kit-dev': {
            version: '1.0.0'
        }
    }
}
