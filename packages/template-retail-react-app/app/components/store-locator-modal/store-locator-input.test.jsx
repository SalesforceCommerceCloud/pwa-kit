/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import StoreLocatorInput from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-input'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor, screen, fireEvent} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import PropTypes from 'prop-types'

const WrapperComponent = ({userHasSetManualGeolocation, getUserGeolocation}) => {
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: 'DE',
            postalCode: '10178'
        }
    })

    return (
        <StoreLocatorInput
            searchStoresParams={{
                postalCode: '10178',
                countryCode: 'DE'
            }}
            getUserGeolocation={getUserGeolocation}
            form={form}
            submitForm={jest.fn()}
            userHasSetManualGeolocation={userHasSetManualGeolocation}
            setUserWantsToShareLocation={jest.fn()}
            userWantsToShareLocation={false}
        />
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
                <WrapperComponent
                    userHasSetManualGeolocation={true}
                    getUserGeolocation={jest.fn()}
                ></WrapperComponent>
            )
        }).not.toThrow()
    })

    test('Expected information exists', async () => {
        renderWithProviders(
            <WrapperComponent
                userHasSetManualGeolocation={true}
                getUserGeolocation={jest.fn()}
            ></WrapperComponent>
        )

        await waitFor(async () => {
            const findButton = screen.getByRole('button', {name: /Find/i})
            const useMyLocationButton = screen.getByRole('button', {name: /Use My Location/i})

            expect(findButton).toBeInTheDocument()
            expect(useMyLocationButton).toBeInTheDocument()
        })
    })

    test('Prop is called when Use My Location is clicked', async () => {
        const getUserGeolocation = jest.fn()
        renderWithProviders(
            <WrapperComponent
                userHasSetManualGeolocation={true}
                getUserGeolocation={getUserGeolocation}
            ></WrapperComponent>
        )
        await waitFor(async () => {
            const useMyLocationButton = screen.getByRole('button', {name: /Use My Location/i})

            fireEvent.click(useMyLocationButton)
            expect(getUserGeolocation).toHaveBeenCalled()
        })
    })
})
