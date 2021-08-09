import React from 'react'
import {render} from '@testing-library/react'
import AppConfig from './index.jsx'
import CommerceAPI from '../../commerce-api'

describe('AppConfig', () => {
    test('renders', () => {
        const {container} = render(<AppConfig />)
        expect(container).toBeDefined()
    })

    test('AppConfig static methods behave as expected', () => {
        expect(AppConfig.restore()).toBe(undefined)
        expect(AppConfig.restore({frozen: 'any values here'})).toBe(undefined)
        expect(AppConfig.freeze()).toBe(undefined)
        expect(AppConfig.extraGetPropsArgs()).toEqual(
            expect.objectContaining({
                api: expect.any(CommerceAPI)
            })
        )
    })
})
