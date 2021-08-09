/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import SocialIcons from './index'
import {renderWithProviders} from '../../utils/test-utils'
import {fireEvent} from '@testing-library/react'

describe('Social Icons Component', () => {
    test('Renders SocialIcons', () => {
        renderWithProviders(<SocialIcons />)

        const links = document.querySelectorAll('button')

        expect(links.length).toBeGreaterThan(0)
    })

    test('should open a new windown when an icon is clicked', () => {
        window.open = jest.fn()
        renderWithProviders(<SocialIcons />)

        const links = document.querySelectorAll('button')
        // click the first link
        fireEvent.click(links[0])
        expect(global.open).toBeCalled()
    })
})
