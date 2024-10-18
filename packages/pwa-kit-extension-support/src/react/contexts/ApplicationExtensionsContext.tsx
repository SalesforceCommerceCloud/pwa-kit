/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {ApplicationExtension} from '../..'
import {ApplicationExtensionConfig as Config} from '../../types'

const defaultValue: ApplicationExtension<Config>[] = []

const ApplicationExtensionsContext = React.createContext(defaultValue)

export default ApplicationExtensionsContext
