/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import StoreLocatorInput from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-input'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor, screen} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import PropTypes from 'prop-types'
import {StoreLocatorContext} from '@salesforce/retail-react-app/app/components/store-locator-modal/index'
import {useStoreLocator} from '@salesforce/retail-react-app/app/components/store-locator-modal/index'
import {STORE_LOCATOR_NUM_STORES_PER_LOAD} from '@salesforce/retail-react-app/app/constants'

const WrapperComponent = ({userHasSetManualGeolocation}) => {
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: 'DE',
            postalCode: '10178'
        }
    })
    const storeLocator = useStoreLocator()
    useEffect(() => {
        storeLocator.setUserHasSetManualGeolocation(userHasSetManualGeolocation)
        storeLocator.setSearchStoresParams({
            postalCode: '10178',
            countryCode: 'DE',
            limit: STORE_LOCATOR_NUM_STORES_PER_LOAD
        })
    }, [])

    return (
        <StoreLocatorContext.Provider value={storeLocator}>
            <StoreLocatorInput form={form} submitForm={jest.fn()} />
        </StoreLocatorContext.Provider>
    )
}
WrapperComponent.propTypes = {
    storesInfo: PropTypes.array,
    userHasSetManualGeolocation: PropTypes.bool,
    getUserGeolocation: PropTypes.func
}

describe('StoreLocatorInput', () => {
    afterEach(() => {
        jest.clearAllMocks()
        jest.resetModules()
    })
    test('Renders without crashing', () => {
        expect(() => {
            renderWithProviders(
                <WrapperComponent userHasSetManualGeolocation={true}></WrapperComponent>
            )
        }).not.toThrow()
    })

    test('Expected information exists', async () => {
        renderWithProviders(
            <WrapperComponent userHasSetManualGeolocation={true}></WrapperComponent>
        )

        await waitFor(async () => {
            const findButton = screen.getByRole('button', {name: /Find/i})
            const useMyLocationButton = screen.getByRole('button', {name: /Use My Location/i})

            expect(findButton).toBeInTheDocument()
            expect(useMyLocationButton).toBeInTheDocument()
        })
    })
})
