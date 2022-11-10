/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import useCommerceApi from './useCommerceApi'
import {renderWithProviders} from '../test-utils'

jest.mock('../auth/index.ts');

test(
    'useCommerceApi returns a set of api clients',
    async () => {
        const Component = () => {
            const api = useCommerceApi()
            return (
                <>
                    <p>{api?.shopperSearch && 'shopperSearch'}</p>
                    <p>{api?.shopperBaskets && 'shopperBaskets'}</p>
                    </>
            )
        }
        renderWithProviders(<Component />)
        expect(screen.getByText('shopperSearch')).toBeInTheDocument()
        expect(screen.getByText('shopperBaskets')).toBeInTheDocument()
    }
)