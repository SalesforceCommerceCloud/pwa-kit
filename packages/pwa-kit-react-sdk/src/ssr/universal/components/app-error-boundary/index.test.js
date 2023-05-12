/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import {AppErrorBoundaryWithoutRouter as AppErrorBoundary} from './index'
import * as errors from '../../errors'
import sinon from 'sinon'

describe('AppErrorBoundary', () => {
    const cases = [
        {
            content: <p>test 1</p>,
            errorFactory: () => ({error: {message: 'Not found', status: 404}}),
            afterErrorAssertions: (renderedResult) => {
                expect(renderedResult.getByText('Error Status: 404')).toBeInTheDocument()
                expect(renderedResult.getByText('Not found')).toBeInTheDocument()
            },
            variation: 'SDK HTTP Errors'
        },
        {
            content: <p>test 2</p>,
            errorFactory: () => ({error: {message: 'Some other error', status: 500}}),
            afterErrorAssertions: (renderedResult) => {
                expect(renderedResult.getByText('Error Status: 500')).toBeInTheDocument()
                expect(renderedResult.getByText('Some other error')).toBeInTheDocument()
            },
            variation: 'Generic Javascript Errors'
        },
        {
            content: <p>test 3</p>,
            errorFactory: () => ({error: {message: 'Some string error', status: 500}}),
            afterErrorAssertions: (renderedResult) => {
                expect(renderedResult.getByText('Error Status: 500')).toBeInTheDocument()
                expect(renderedResult.getByText('Some string error')).toBeInTheDocument()
            },
            variation: 'Error Strings'
        },
        {
            content: <p>test 4</p>,
            errorFactory: () => ({error: {message: undefined, status: undefined}}), // TODO: potentially modify as message/status are marked as required
            afterErrorAssertions: (renderedResult) => {
                expect(renderedResult.getByText('Error Status:')).toBeInTheDocument()
            },
            variation: 'Check for message value to be empty if undefined'
        }
    ]
    cases.forEach(({content, errorFactory, afterErrorAssertions, variation}) => {
        test(`Displays errors correctly (variation: ${variation})`, () => {
            const {unmount, rerender} = render(<AppErrorBoundary>{content}</AppErrorBoundary>)
            const contentElement = document.querySelector('p')
            expect(contentElement).toBeInTheDocument()
            expect(content.props.children).toEqual(contentElement.textContent)
            // rerender(<AppErrorBoundary {...errorFactory()}>{content}</AppErrorBoundary>) // TODO: understand why this is not working
            unmount() // ideally replaced with rerender
            const renderedResult = render(<AppErrorBoundary {...errorFactory()}>{content}</AppErrorBoundary>) // TODO: check if there's a way to call onGetPropsError
            expect(contentElement).not.toBeInTheDocument()
            afterErrorAssertions(renderedResult)
        })

        // TODO: fix test
        test(`Watches history, when provided (variation: ${variation})`, () => {
            const history = {listen: sinon.stub().returns(sinon.stub())}
            const wrapper = mount(<AppErrorBoundary history={history}>{content}</AppErrorBoundary>)
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

    test(`componentWillUnmount unlistens to history`, () => {
        const unlisten = jest.fn()
        const history = {listen: jest.fn().mockReturnValue(unlisten)}
        const wrapper = mount(<AppErrorBoundary history={history}>test</AppErrorBoundary>)
        wrapper.unmount()
        expect(unlisten).toBeCalled()
    })
})
