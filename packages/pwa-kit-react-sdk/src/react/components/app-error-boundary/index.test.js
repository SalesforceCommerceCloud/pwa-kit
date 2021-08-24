/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {mount} from 'enzyme'
import {AppErrorBoundaryWithoutRouter as AppErrorBoundary} from './index'
import * as errors from '../../../utils/errors'

describe('AppErrorBoundary', () => {
    const cases = [
        {
            content: <p>test 1</p>,
            errorFactory: () => new errors.HTTPNotFound('Not found'),
            afterErrorAssertions: (wrapper) => {
                expect(wrapper.contains(<h1>Error Status: 404</h1>)).toBe(true)
                expect(wrapper.contains(<pre>Not found</pre>)).toBe(true)
            },
            variation: 'SDK HTTP Errors'
        },
        {
            content: <p>test 2</p>,
            errorFactory: () => new Error('Some other error'),
            afterErrorAssertions: (wrapper) => {
                expect(wrapper.contains(<h1>Error Status: 500</h1>)).toBe(true)
                expect(wrapper.contains(<pre>Error: Some other error</pre>)).toBe(true)
            },
            variation: 'Generic Javascript Errors'
        },
        {
            content: <p>test 3</p>,
            errorFactory: () => 'Some string error',
            afterErrorAssertions: (wrapper) => {
                expect(wrapper.contains(<h1>Error Status: 500</h1>)).toBe(true)
                expect(wrapper.contains(<pre>Some string error</pre>)).toBe(true)
            },
            variation: 'Error Strings'
        },
        {
            content: <p>test 4</p>,
            errorFactory: () => undefined,
            afterErrorAssertions: (wrapper) => {
                expect(wrapper.find('Error').prop('message')).toBe('')
            },
            variation: 'Check for message value to be empty if undefined'
        }
    ]
    cases.forEach(({content, errorFactory, afterErrorAssertions, variation}) => {
        test(`Displays errors correctly (variation: ${variation})`, () => {
            const wrapper = mount(<AppErrorBoundary>{content}</AppErrorBoundary>)
            expect(wrapper.contains(content)).toBe(true)
            wrapper.instance().onGetPropsError(errorFactory())
            wrapper.update()
            expect(wrapper.contains(content)).toBe(false)
            afterErrorAssertions(wrapper)
        })
    })

    test(`Display Error message from getDerivedStateFromError`, () => {
        const error = new Error('test')
        const result = AppErrorBoundary.getDerivedStateFromError(error)
        expect(result.error.message).toEqual(error.toString())
    })
})
