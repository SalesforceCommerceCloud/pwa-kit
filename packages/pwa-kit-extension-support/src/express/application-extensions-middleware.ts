/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Request, Response, NextFunction, Application} from 'express'

// Local Imports
import {ApplicationExtension} from './application-extension'
// import {getApplicationExtensions} from '../shared/utils/universal-utils' // Because there is some kind of module caching we can't have this shared!

// TODO: Define our own type for this extension.
// import {ApplicationExtensionConfig} from '../types'

import APPLICATION_EXTENSIONS from './assets/application-extensions-placeholder'

// Define the middleware function that modifies the app
const applicationExtensionsMiddleware = (app: Application) => {
    // const applicationExtensions = getApplicationExtensions<ApplicationExtension<ApplicationExtensionConfig>>() as ApplicationExtension<ApplicationExtensionConfig>[]
    console.log('applicationExtensionsMiddleware: applying ', APPLICATION_EXTENSIONS)
    APPLICATION_EXTENSIONS.forEach((applicationExtension) => {
        // if (applicationExtension.getConfig().enabled)
        app = applicationExtension.extendApp(app)
    })
    
    return (req: Request, res: Response, next: NextFunction): void => {
        next()
    }
}

export default applicationExtensionsMiddleware