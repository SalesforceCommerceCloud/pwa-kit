/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react-hooks'
import {useCategories} from './use-categories'
import {CategoriesProvider} from '../contexts'
import {mockCategories as initialMockCategories} from '../commerce-api/mock-data'

const wrapper = ({children}) => <CategoriesProvider>{children}</CategoriesProvider>

let resultCategories = {}

const mockSetCategories = jest.fn().mockImplementation((categories) => {
    resultCategories = {categories}

    return resultCategories
})

const mockUseContext = jest.fn().mockImplementation(() => ({
    categories: {},
    setCategories: mockSetCategories
}))

React.useContext = mockUseContext
describe('useCategories', () => {
    it('should set initial categories', () => {
        const {result} = renderHook(() => useCategories(), {wrapper})

        expect(resultCategories).toMatchObject({})

        result.current.setCategories(initialMockCategories)

        expect(mockUseContext).toHaveBeenCalled()
        expect(resultCategories).toHaveProperty('categories')
    })
})
