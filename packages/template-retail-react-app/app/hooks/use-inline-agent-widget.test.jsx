/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {render, waitFor, cleanup} from '@testing-library/react'
import useInlineAgentWidget from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'

const baseConfig = {
    enabled: true,
    scrt2Url: 'https://scrt2.example',
    orgId: '00D123',
    esDeveloperName: 'storefront_agent'
}

const Mount = ({config}) => {
    const ref = useInlineAgentWidget(config, {
        productName: 'TrailFit',
        pdpQuestions: ['How does it fit?']
    })
    return <div ref={ref} />
}

Mount.propTypes = {config: PropTypes.object}

describe('embedded widget pre-warm configuration', () => {
    beforeAll(() => {
        if (!customElements.get('inline-agent-widget')) {
            customElements.define('inline-agent-widget', class extends HTMLElement {})
        }
    })

    afterEach(cleanup)

    test.each([
        ['inline', undefined, true],
        ['inline', true, true],
        ['inline', false, false],
        ['shopper-agent', true, true]
    ])('preserves %s mode with preWarm=%s', async (mode, preWarm, expected) => {
        const {container, unmount} = render(<Mount config={{...baseConfig, mode, preWarm}} />)
        await waitFor(() => expect(container.querySelector('inline-agent-widget')).not.toBeNull())
        const widget = container.querySelector('inline-agent-widget')
        expect(widget.hasAttribute('pre-warm')).toBe(expected)
        expect(widget.getAttribute('mode')).toBe(mode)
        expect(widget.getAttribute('product-name')).toBe('TrailFit')
        expect(widget.getAttribute('capabilities-version')).toBe('66')
        unmount()
        expect(container.querySelector('inline-agent-widget')).toBeNull()
    })

    test('can turn pre-warm off when configuration changes', async () => {
        const {container, rerender} = render(<Mount config={{...baseConfig, preWarm: true}} />)
        await waitFor(() => expect(container.querySelector('inline-agent-widget')).not.toBeNull())
        expect(container.querySelector('inline-agent-widget').hasAttribute('pre-warm')).toBe(true)
        rerender(<Mount config={{...baseConfig, preWarm: false}} />)
        await waitFor(() =>
            expect(container.querySelector('inline-agent-widget').hasAttribute('pre-warm')).toBe(
                false
            )
        )
    })
})
