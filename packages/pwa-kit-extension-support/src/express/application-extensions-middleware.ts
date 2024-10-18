/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Request, Response, NextFunction, Application} from 'express'

// Local Imports
import applicationExtensions from './assets/application-extensions-placeholder'

// TODO: Define our own type for this extension.
// import {ApplicationExtensionConfig} from '../types'

// Define the middleware function that modifies the app
const applicationExtensionsMiddleware = (app: Application) => {
    applicationExtensions
        .filter((applicationExtension) => applicationExtension.isEnabled())
        .forEach((applicationExtension) => {
            app = applicationExtension.extendApp(app)
        })

    return (req: Request, res: Response, next: NextFunction): void => {
        next()
    }
}

export default applicationExtensionsMiddleware
