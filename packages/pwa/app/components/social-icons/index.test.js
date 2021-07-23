import React from 'react'
import SocialIcons from './index'
import {renderWithProviders} from '../../utils/test-utils'

test('Renders SocialIcons', () => {
    renderWithProviders(<SocialIcons />)

    const links = document.querySelectorAll('button')

    expect(links.length).toBeGreaterThan(0)
})
