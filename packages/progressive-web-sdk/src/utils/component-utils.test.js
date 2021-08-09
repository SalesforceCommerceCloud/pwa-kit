/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {getBoundedValue, getDisplayName} from './component-utils'

describe('getBoundedValue', () => {
    test('returns the minimum value when value is less than minimum value', () => {
        const result = getBoundedValue(2, 5, 10)
        expect(result).toBe(5)
    })

    test('returns the maximumValue when value is greater than maximum value', () => {
        const result = getBoundedValue(11, 5, 10)
        expect(result).toBe(10)
    })

    test('returns the value when it is between minimum and maximum value', () => {
        const result = getBoundedValue(6, 5, 10)
        expect(result).toBe(6)
    })
})

describe('getDisplayName', () => {
    test('returns displayName if provided', () => {
        // eslint-disable-next-line react/prefer-stateless-function
        class AMockComponent extends React.Component {
            render() {
                return <div>More mock html</div>
            }
        }
        AMockComponent.displayName = 'Foo'
        expect(getDisplayName(AMockComponent)).toEqual('Foo')
    })

    test('returns name if provided', () => {
        // eslint-disable-next-line react/prefer-stateless-function
        class AnotherMockComponent extends React.Component {
            render() {
                return <div>More mock html</div>
            }
        }
        expect(getDisplayName(AnotherMockComponent)).toEqual('AnotherMockComponent')
    })

    test('returns default string `Component` if no name is present', () => {
        expect(getDisplayName(<div />)).toEqual('Component')
    })
})
