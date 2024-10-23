/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Request, Response, NextFunction, Application} from 'express'

// Local Imports
import {getApplicationExtensions} from './assets/application-extensions-placeholder'

// TODO: Define our own type for this extension.
// import {ApplicationExtensionConfig} from '../types'

// Define the middleware function that modifies the app
const applyApplicationExtensions = (app: Application) => {
    const applicationExtensions = getApplicationExtensions()
    applicationExtensions
        .filter((applicationExtension: any) => applicationExtension.isEnabled())
        .forEach((applicationExtension: any) => {
            app = applicationExtension.extendApp(app)
        })

    return (req: Request, res: Response, next: NextFunction): void => {
        next()
    }
}

export default applyApplicationExtensions
