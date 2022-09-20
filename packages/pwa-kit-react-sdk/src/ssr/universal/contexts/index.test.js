/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {mount, shallow} from 'enzyme'
import {Router} from 'react-router-dom'
import {createMemoryHistory} from 'history'

import {CorrelationIdProvider} from './index'
import {useCorrelationId} from '../hooks'
import crypto from 'crypto'
const SampleProvider = (props) => {
    const {correlationId, resetOnPageChange} = props
    return (
        <CorrelationIdProvider correlationId={correlationId} resetOnPageChange={resetOnPageChange}>
            {props.children}
        </CorrelationIdProvider>
    )
}

const Component = () => {
    const {correlationId} = useCorrelationId()
    return <div className={'correlation-id'}>{correlationId}</div>
}
describe('CorrelationIdProvider', function() {
    test('Renders without errors', () => {
        const history = createMemoryHistory()
        const id = crypto.randomUUID()

        const wrapper = shallow(
            <Router history={history}>
                <SampleProvider correlationId={() => id}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(wrapper.find(Component)).toHaveLength(1)
    })

    test('renders when correlationId is passed as a function', () => {
        const id = crypto.randomUUID()
        const history = createMemoryHistory()
        const wrapper = mount(
            <Router history={history}>
                <SampleProvider correlationId={() => id}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(wrapper.text().includes(id)).toBe(true)
    })

    test('renders when correlationId is passed as a string', () => {
        const id = crypto.randomUUID()
        const history = createMemoryHistory()

        const wrapper = mount(
            <Router history={history}>
                <SampleProvider correlationId={id} resetOnPageChange={false}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(wrapper.text().includes(id)).toBe(true)
    })

    test('generates a new id when changing page', () => {
        const history = createMemoryHistory()
        const Component = () => {
            const {correlationId} = useCorrelationId()
            return (
                <div>
                    <div className="correlation-id">{correlationId}</div>
                    <button className="button" onClick={() => history.push('/page-1')}>
                        Go to another page
                    </button>
                </div>
            )
        }

        const wrapper = mount(
            <Router history={history}>
                <SampleProvider correlationId={() => crypto.randomUUID()}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        const firstRenderedId = wrapper.find('.correlation-id').text()
        const button = wrapper.find('.button')
        button.simulate('click')
        const secondRenderedId = wrapper.find('.correlation-id').text()
        // expecting the provider to have a different correlation id when a page navigation happens
        expect(firstRenderedId).not.toEqual(secondRenderedId)
    })
})
