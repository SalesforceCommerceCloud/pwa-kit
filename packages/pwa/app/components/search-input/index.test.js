import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import SearchInput from './index'

test('renders SearchInput', () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    expect(searchInput).toBeInTheDocument()
})
