/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {act, render, screen} from '@testing-library/react'
import {AppErrorBoundaryWithoutRouter as AppErrorBoundary} from './index'
import * as errors from '../../errors'
import sinon from 'sinon'

describe('AppErrorBoundary', () => {
    const cases = [
        {
            content: 'test 1',
            errorFactory: () => new errors.HTTPNotFound('Not found'),
            afterErrorAssertions: () => {
                expect(screen.getByText('Error Status: 404')).toBeInTheDocument()
                expect(screen.getByText('Not found')).toBeInTheDocument()
            },
            variation: 'SDK HTTP Errors'
        },
        {
            content: 'test 2',
            errorFactory: () => new Error('Some other error'),
            afterErrorAssertions: async () => {
                expect(screen.getByText('Error Status: 500')).toBeInTheDocument()
                expect(screen.getByText('Error: Some other error')).toBeInTheDocument()
            },
            variation: 'Generic Javascript Errors'
        },
        {
            content: 'test 3',
            errorFactory: () => 'Some string error',
            afterErrorAssertions: () => {
                expect(screen.getByText('Error Status: 500')).toBeInTheDocument()
                expect(screen.getByText('Some string error')).toBeInTheDocument()
            },
            variation: 'Error Strings'
        },
        {
            content: 'test 4',
            errorFactory: () => undefined,
            afterErrorAssertions: () => {
                expect(screen.getByText('Error Status: 500')).toBeInTheDocument()
                expect(document.querySelector('pre').innerHTML).toBe('')
            },
            variation: 'Check for message value to be empty if undefined'
        }
    ]
    cases.forEach(({content, errorFactory, afterErrorAssertions, variation}) => {
        test(`Displays errors correctly (variation: ${variation})`, () => {
            const ref = React.createRef()
            render(
                <AppErrorBoundary ref={ref}>
                    <>{content}</>
                </AppErrorBoundary>
            )
            expect(screen.getByText(content)).toBeInTheDocument()
            act(() => {
                ref.current.onGetPropsError(errorFactory())
            })
            expect(screen.queryByText(content)).toBeNull()
            afterErrorAssertions()
        })

        test(`Watches history, when provided (variation: ${variation})`, () => {
            const history = {listen: sinon.stub().returns(sinon.stub())}
            const ref = React.createRef()
            render(
                <AppErrorBoundary ref={ref} history={history}>
                    <>{content}</>
                </AppErrorBoundary>
            )
            expect(screen.getByText(content)).toBeInTheDocument()
            act(() => {
                ref.current.onGetPropsError(errorFactory())
            })
            expect(screen.queryByText(content)).toBeNull()
            afterErrorAssertions()
            expect(history.listen.called).toBe(true)
        })
    })

    test(`Display Error message from getDerivedStateFromError`, () => {
        const error = new Error('test')
        const result = AppErrorBoundary.getDerivedStateFromError(error)
        expect(result.error.message).toEqual(error.toString())
    })

    test(`componentWillUnmount unlistens to history`, () => {
        const unlisten = jest.fn()
        const history = {listen: jest.fn().mockReturnValue(unlisten)}
        const wrapper = render(<AppErrorBoundary history={history}>test</AppErrorBoundary>)
        wrapper.unmount()
        expect(unlisten).toHaveBeenCalled()
    })
})
