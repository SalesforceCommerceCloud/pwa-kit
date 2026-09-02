/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import Header from '@salesforce/retail-react-app/app/page-designer/layouts/header/index'
import {registry} from '@salesforce/commerce-sdk-react/page-designer'

const makeComponent = (regions) => ({
    id: 'header',
    typeId: 'commerce_layouts.header',
    regions
})

beforeAll(() => {
    // The embedded region renders authored components through the V2 registry.
    registry.registerComponent('test.banner', (props) => <div>{props.message}</div>)
})

test('renders the announcement region components', () => {
    const component = makeComponent([
        {
            id: 'announcement',
            components: [{id: 'b1', typeId: 'test.banner', data: {message: 'Hello from banner'}}]
        }
    ])
    const {getByText} = render(<Header component={component} />)
    expect(getByText('Hello from banner')).toBeInTheDocument()
})

test('renders nothing when there is no announcement region', () => {
    const component = makeComponent([{id: 'other', components: []}])
    const {container} = render(<Header component={component} />)
    expect(container).toBeEmptyDOMElement()
})
