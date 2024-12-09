/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, createContext, ReactNode} from 'react'
import {Config as StoreLocatorConfig} from '../types/config'

type Mode = 'device' | 'input'
interface FormValues {
    countryCode: string
    postalCode: string
}

interface DeviceCoordinates {
    latitude: number | null
    longitude: number | null
}

interface StoreLocatorState {
    mode: Mode
    formValues: FormValues
    deviceCoordinates: DeviceCoordinates
    config: StoreLocatorConfig
}

interface StoreLocatorContextValue {
    state: StoreLocatorState
    setState: React.Dispatch<React.SetStateAction<StoreLocatorState>>
}

interface StoreLocatorProviderProps {
    config: StoreLocatorConfig
    children: ReactNode
}

export const StoreLocatorContext = createContext<StoreLocatorContextValue | null>(null)

export const StoreLocatorProvider: React.FC<StoreLocatorProviderProps> = ({config, children}) => {
    const [state, setState] = useState<StoreLocatorState>({
        mode: 'input',
        formValues: {
            countryCode: config.defaultCountryCode,
            postalCode: config.defaultPostalCode
        },
        deviceCoordinates: {
            latitude: null,
            longitude: null
        },
        config
    })

    const value: StoreLocatorContextValue = {
        state,
        setState
    }

    return <StoreLocatorContext.Provider value={value}>{children}</StoreLocatorContext.Provider>
}

export type {StoreLocatorContextValue, StoreLocatorState, Mode, FormValues, DeviceCoordinates}
