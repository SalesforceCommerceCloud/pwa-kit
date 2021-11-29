/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

/**
 * This React context is used to provide global application data to its
 * children. Currently the context value consists of the object returned
 * from the AppConfig components `freezeRequest` static method.
 */
export const AppContext = React.createContext({})
