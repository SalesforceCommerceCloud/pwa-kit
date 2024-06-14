/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import StoreLocatorInput from '@salesforce/retail-react-app/app/components/store-locator/store-locator-input'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor, screen} from '@testing-library/react'
import {useForm} from 'react-hook-form'
import { Wrap } from '../shared/ui/index'


const WrapperComponent = () => {
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: 'DE',
            postalCode: '10178'
        }
    })

    return <StoreLocatorInput
        searchStoresParams={{
            postalCode: '10178',
            countryCode: 'DE'
        }}
        setSearchStoresParams={jest.fn()}
        form={form}
        submitForm={jest.fn()}
    />
}

describe('StoreLocatorInput', () => {
    test('renders without crashing', () => {
        expect(() => {
            
            renderWithProviders(
                <WrapperComponent></WrapperComponent>
            )
        }).not.toThrow()
    })

    test('Expected information exists', async () => {
        renderWithProviders(
            <WrapperComponent></WrapperComponent>
        )

        await waitFor(async () => {
            const findButton = screen.getByRole('button', {name: /Find/i})
            const useMyLocationButton = screen.getByRole('button', {name: /Use My Location/i})

            expect(findButton).toBeInTheDocument()
            expect(useMyLocationButton).toBeInTheDocument()
        })
    })
})
