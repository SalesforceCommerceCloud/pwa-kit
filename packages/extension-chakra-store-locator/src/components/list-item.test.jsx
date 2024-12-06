/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../test-utils'
import {StoreLocatorListItem} from './list-item'
import {Accordion} from '@chakra-ui/react'

describe('StoreLocatorListItem', () => {
    const mockStore = {
        name: 'Test Store',
        address1: '123 Test St',
        city: 'San Francisco',
        stateCode: 'CA',
        postalCode: '94105',
        phone: '555-1234',
        distance: 0.5,
        distanceUnit: 'mi',
        storeHours: '<p>Mon-Fri: 9AM-9PM</p>'
    }

    const renderWithAccordion = (component) => {
        return renderWithProviders(<Accordion>{component}</Accordion>)
    }

    it('renders store information correctly', () => {
        renderWithAccordion(<StoreLocatorListItem store={mockStore} />)

        expect(screen.getByText('Test Store')).toBeTruthy()
        expect(screen.getByText('123 Test St')).toBeTruthy()
        expect(screen.getByText(/San Francisco, CA 94105/)).toBeTruthy()
        expect(screen.getByText('0.5 mi away')).toBeTruthy()
        expect(screen.getByText('Phone: 555-1234')).toBeTruthy()
        expect(screen.getByText('View More')).toBeTruthy()
    })

    it('handles missing optional fields', () => {
        const storeWithMissingFields = {
            name: 'Basic Store',
            address1: '789 Basic St',
            city: 'Simple City',
            postalCode: '12345'
        }

        renderWithAccordion(<StoreLocatorListItem store={storeWithMissingFields} />)

        expect(screen.getByText('Basic Store')).toBeTruthy()
        expect(screen.getByText('789 Basic St')).toBeTruthy()
        expect(screen.getByText(/Simple City/)).toBeTruthy()
        expect(screen.queryByText(/away/)).toBeNull()
        expect(screen.queryByText(/Phone:/)).toBeNull()
        expect(screen.queryByText('View More')).toBeNull()
    })
})
