/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import NestedAccordion from './index'
import {renderWithProviders} from '../../utils/test-utils'

const mockItem = {
    id: 't1',
    name: 'Test One',
    items: [
        {
            id: 't1-1',
            name: 'Test One One'
        },
        {
            id: 't1-2',
            name: 'Test One Two',
            items: [
                {
                    id: 't1-2-1',
                    name: 'Test One Two One'
                },
                {
                    id: 't1-2-2',
                    name: 'Test One Two Two'
                }
            ]
        }
    ]
}
test('Renders NestedAccordion', () => {
    renderWithProviders(<NestedAccordion item={mockItem} />)

    const accordions = document.querySelectorAll('.sf-nested-accordion')

    expect(accordions.length).toEqual(2)
})

test('Renders NestedAccordion with items elements before and after', () => {
    renderWithProviders(
        <NestedAccordion
            item={mockItem}
            itemsBefore={[
                <div className="itemsBefore" key="before">
                    before
                </div>
            ]}
            itemsAfter={[
                <div className="itemsAfter" key="after">
                    before
                </div>
            ]}
        />
    )

    const itemBefore = document.querySelector('.itemsBefore')
    const itemAfter = document.querySelector('.itemsAfter')

    expect(itemBefore).toBeInTheDocument()
    expect(itemAfter).toBeInTheDocument()
})

test('Renders NestedAccordion with items functions before and after', () => {
    const onItemsBefore = jest.fn(() => [
        <div className="itemsBefore" key="before">
            before
        </div>
    ])
    const onItemsAfter = jest.fn(() => [
        <div className="itemsAfter" key="after">
            after
        </div>
    ])

    renderWithProviders(
        <NestedAccordion item={mockItem} itemsBefore={onItemsBefore} itemsAfter={onItemsAfter} />
    )

    const itemBefore = document.querySelector('.itemsBefore')
    const itemAfter = document.querySelector('.itemsAfter')

    expect(onItemsBefore).toHaveBeenCalled()
    expect(onItemsAfter).toHaveBeenCalled()
    expect(itemBefore).toBeInTheDocument()
    expect(itemAfter).toBeInTheDocument()
})

test('Renders NestedAccordion with custom url builder', () => {
    const mockPath = '/mock-path'
    renderWithProviders(<NestedAccordion item={mockItem} urlBuilder={() => mockPath} />)

    const firstLeafLink = document.querySelector('.sf-nested-accordion a')
    expect(firstLeafLink.href.endsWith(mockPath)).toEqual(true)
})
