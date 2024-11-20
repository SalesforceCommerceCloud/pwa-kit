/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'

// Local
import {ApplicationExtension} from '../classes/ApplicationExtension'

// Types
import {ApplicationExtensionConfig as Config} from '../../types'

/**
 * This React contexts is used to wrap the entire PWA-Kit application. It is used
 * by the useApplicationExtensions hook to return all the extensions that have been
 * applied to you base application component.
 *
 * This utility can be used for many purposes. For example, using it in development
 * tools to show what Application Extensions that are currently in use.
 */
export default React.createContext<ApplicationExtension<Config>[] | undefined>(undefined)
