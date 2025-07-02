/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {Router} from 'react-router-dom'
import {createMemoryHistory} from 'history'

import {CorrelationIdProvider} from './index'
import {useCorrelationId} from '../hooks'
import crypto from 'crypto'
import PropTypes from 'prop-types'
import userEvent from '@testing-library/user-event'
const SampleProvider = (props) => {
    const {correlationId, resetOnPageChange} = props
    return (
        <CorrelationIdProvider correlationId={correlationId} resetOnPageChange={resetOnPageChange}>
            {props.children}
        </CorrelationIdProvider>
    )
}

SampleProvider.propTypes = {
    children: PropTypes.element.isRequired,
    resetOnPageChange: PropTypes.bool,
    correlationId: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired
}

const Component = () => {
    const {correlationId} = useCorrelationId()
    return <div className={'correlation-id'}>{correlationId}</div>
}
describe('CorrelationIdProvider', function () {
    test('Renders without errors', () => {
        const history = createMemoryHistory()
        const id = crypto.randomUUID()

        render(
            <Router history={history}>
                <SampleProvider correlationId={() => id}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(screen.getByText(id)).toBeInTheDocument()
    })

    test('renders when correlationId is passed as a function', () => {
        const id = crypto.randomUUID()
        const history = createMemoryHistory()
        render(
            <Router history={history}>
                <SampleProvider correlationId={() => id}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(screen.getByText(id)).toBeInTheDocument()
    })

    test('renders when correlationId is passed as a string', () => {
        const id = crypto.randomUUID()
        const history = createMemoryHistory()

        render(
            <Router history={history}>
                <SampleProvider correlationId={id} resetOnPageChange={false}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(screen.getByText(id)).toBeInTheDocument()
    })

    test('generates a new id when changing page', async () => {
        const user = userEvent.setup()
        const history = createMemoryHistory()
        const Component = () => {
            const {correlationId} = useCorrelationId()
            return (
                <div>
                    <div data-testid="correlation-id">{correlationId}</div>
                    <button className="button" onClick={() => history.push('/page-1')}>
                        Go to another page
                    </button>
                </div>
            )
        }

        render(
            <Router history={history}>
                <SampleProvider correlationId={() => crypto.randomUUID()}>
                    <Component />
                </SampleProvider>
            </Router>
        )

        const firstRenderedId = screen.getByTestId('correlation-id').innerHTML
        const button = screen.getByText(/go to another page/i)
        await user.click(button)
        const secondRenderedId = screen.getByTestId('correlation-id').innerHTML
        // expecting the provider to have a different correlation id when a page navigation happens
        expect(firstRenderedId).not.toEqual(secondRenderedId)
    })
})
