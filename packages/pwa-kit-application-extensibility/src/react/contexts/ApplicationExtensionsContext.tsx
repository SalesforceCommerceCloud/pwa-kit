/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'

// Local
import {ApplicationExtension} from '../ApplicationExtension'

// Types
import {ApplicationExtensionConfig as Config} from '../../types'

export default React.createContext<ApplicationExtension<Config>[]>([])
