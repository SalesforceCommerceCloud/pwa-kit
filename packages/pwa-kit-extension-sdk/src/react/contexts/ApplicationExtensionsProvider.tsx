/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Local
import ApplicationExtensionsContext from './ApplicationExtensionsContext'

import {
    ApplicationExtension,
    ReactApplicationExtensionConfig
} from '../classes/ApplicationExtension'
// TODO: Move these to some other type file.
/**
 * Props for the ApplicationExtensionsProvider component.
 *
 * @typedef {Object} ApplicationExtensionsProviderProps
 * @property {React.ReactNode} children - The child components to render within this provider.
 */
type ApplicationExtensionsProviderProps = {
    children: any
    extensions: ApplicationExtension<ReactApplicationExtensionConfig>[]
}

/**
 * ApplicationExtensionsProvider component
 *
 * This provider component is responsible for initializing and supplying application extensions
 * to the `ApplicationExtensionsContext`. It retrieves extensions using `getApplicationExtensions`
 * and provides an empty array to the context as a placeholder for extension data.
 *
 * @component
 * @param {ApplicationExtensionsProviderProps} props - Component properties.
 * @returns {JSX.Element} A context provider for application extensions.
 */
const ApplicationExtensionsProvider = ({
    children,
    extensions
}: ApplicationExtensionsProviderProps) => (
    <ApplicationExtensionsContext.Provider value={extensions}>
        {children}
    </ApplicationExtensionsContext.Provider>
)

export default ApplicationExtensionsProvider
