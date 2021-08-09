/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import {Ledger, LedgerRow} from './index.js'

/* eslint-disable newline-per-chained-call */

describe('LedgerRow', () => {
    test('renders without errors', () => {
        const wrapper = mount(
            <table>
                <tbody>
                    <LedgerRow />
                </tbody>
            </table>
        )
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<LedgerRow />)

        expect(wrapper.hasClass('pw-ledger__row')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<LedgerRow />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<LedgerRow className={name} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('sets the total class if isTotal is true', () => {
        const wrapper = shallow(<LedgerRow isTotal />)
        expect(wrapper.hasClass('pw--total')).toBe(true)
    })

    test('renders label, value, and no actions by default', () => {
        const wrapper = shallow(<LedgerRow label="Subtotal" value="15€20" />)

        expect(wrapper.find('.pw-ledger__action').length).toBe(0)
        expect(wrapper.find('.pw-ledger__item').text()).toBe('Subtotal')
        expect(wrapper.find('.pw-ledger__value').text()).toBe('15€20')
    })

    test('renders the labelAction if present', () => {
        const labelAction = <a href="#test">Test</a>
        const wrapper = shallow(<LedgerRow label="LedgerRow" labelAction={labelAction} />)

        expect(
            wrapper
                .find('.pw-ledger__item')
                .childAt(0)
                .text()
        ).toBe('LedgerRow')
        expect(
            wrapper
                .find('.pw-ledger__item .pw-ledger__action')
                .children()
                .get(0)
        ).toEqual(labelAction)
    })

    test('renders the valueAction if present', () => {
        const valueAction = <button>X</button>
        const wrapper = shallow(<LedgerRow value="¥1700" valueAction={valueAction} />)

        expect(
            wrapper
                .find('.pw-ledger__value')
                .childAt(0)
                .text()
        ).toBe('¥1700')
        expect(
            wrapper
                .find('.pw-ledger__value .pw-ledger__action')
                .children()
                .get(0)
        ).toEqual(valueAction)
    })
})

describe('Ledger', () => {
    test('renders without errors', () => {
        const wrapper = mount(<Ledger rows={[]} />)
        expect(wrapper.length).toBe(1)
    })

    test('includes its children as the children of the Ledger', () => {
        const wrapper = shallow(
            <Ledger>
                <LedgerRow className="js-test" />
            </Ledger>
        )

        expect(wrapper.contains(<LedgerRow className="js-test" />)).toBe(true)
    })

    test('renders a row for each of the row props passed', () => {
        const rows = [
            {
                label: 'subtotal',
                value: '12.99'
            },
            {
                label: 'tax',
                value: '0.00'
            }
        ]
        const wrapper = mount(<Ledger rows={rows} />)
        const ledgerRows = wrapper.find('.pw-ledger__row')

        expect(ledgerRows.length).toBe(rows.length)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<Ledger rows={[]} />)

        expect(wrapper.hasClass('pw-ledger')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<Ledger rows={[]} />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<Ledger className={name} rows={[]} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('fails propType validation if non-LedgerRow children are passed', () => {
        expect(
            Ledger.propTypes.children({children: <span>Test</span>}, 'children', 'Ledger')
        ).toEqual(new Error('Ledger only accepts children of type "LedgerRow"'))
    })

    test('No errors caused by propType validation if boolean children are passed', () => {
        expect(Ledger.propTypes.children({children: false}, 'children', 'Ledger')).toEqual(
            undefined
        )
    })
})
