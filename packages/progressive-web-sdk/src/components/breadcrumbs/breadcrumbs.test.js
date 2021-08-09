/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import Link from '../link'
import Breadcrumbs from './index'
import {mountWithRouter} from '../../utils/testing'

test('Breadcrumbs renders without errors', () => {
    const wrapper = mount(<Breadcrumbs />)
    expect(wrapper.length).toBe(1)
})

test('renders a Link with relative path', () => {
    const items = [
        {
            text: 'Home',
            href: '/'
        }
    ]
    const wrapper = mountWithRouter(<Breadcrumbs items={items} />)
    expect(wrapper.find(Link).length).toBe(1)
})

test('creates an li for each item in items', () => {
    const items = [
        {
            text: 'Home',
            href: 'http://www.mobify.com'
        },
        {
            text: 'Cat',
            href: 'http://www.mobify.com'
        },
        {
            text: 'Food'
        }
    ]
    const wrapper = shallow(<Breadcrumbs items={items} />)
    const listElements = wrapper.find('li')

    expect(listElements.length).toBe(items.length)
})

test('renders a Link', () => {
    const items = [
        {
            text: 'Home',
            href: 'http://www.mobify.com'
        }
    ]
    const wrapper = mount(<Breadcrumbs items={items} />)

    expect(wrapper.find(Link).length).toBe(1)
})

test('wraps breadcrumb item content in a link if the href prop is passed', () => {
    const items = [
        {
            text: 'Home',
            href: 'http://www.mobify.com'
        }
    ]
    const wrapper = mount(<Breadcrumbs items={items} />)
    const link = wrapper.find('.pw-breadcrumbs__item a')

    expect(link.length).toBe(1)
})

test('wraps breadcrumb item content in a link if the onClick prop is passed', () => {
    const items = [
        {
            text: 'Home',
            onClick: () => {}
        }
    ]
    const wrapper = mount(<Breadcrumbs items={items} />)
    const link = wrapper.find('.pw-breadcrumbs__item a')

    expect(link.length).toBe(1)
})

test('onClick prop is passed to a link', () => {
    const items = [
        {
            text: 'Home',
            onClick: () => {}
        }
    ]
    const wrapper = mount(<Breadcrumbs items={items} />)
    const link = wrapper.find('.pw-breadcrumbs__item a')

    expect(link.props().onClick).toBeDefined()
})

test('does not wrap breadcrumb item content in a link if the href prop is not passed', () => {
    const items = [
        {
            text: 'Home'
        }
    ]
    const wrapper = mount(<Breadcrumbs items={items} />)
    const link = wrapper.find('.pw-breadcrumbs__item a')

    expect(link.length).toBe(0)
})

test('aria label contains the correct location', () => {
    const items = [
        {
            text: 'Home',
            href: 'http://www.mobify.com'
        },
        {
            text: 'Cat',
            href: 'http://www.mobify.com'
        },
        {
            text: 'Food'
        }
    ]

    const wrapper = shallow(<Breadcrumbs items={items} />)
    const label = wrapper.find('.pw-breadcrumbs__label')
    const lastItemRegex = new RegExp(items[items.length - 1])

    expect(lastItemRegex.test(label.text())).toBe(true)
})

test('aria label contains the correct youAreHereMessage', () => {
    const items = [
        {
            text: 'Home'
        }
    ]
    const youAreHereMessage = 'You are at this location'
    const wrapper = shallow(<Breadcrumbs items={items} youAreHereMessage={youAreHereMessage} />)
    const label = wrapper.find('.pw-breadcrumbs__label')
    const youAreHereMessageRegex = new RegExp(youAreHereMessage)

    expect(youAreHereMessageRegex.test(label.text())).toBe(true)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Breadcrumbs items={[{text: 'test'}]} />)

    expect(wrapper.hasClass('pw-breadcrumbs')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Breadcrumbs items={[{text: 'test'}]} />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Breadcrumbs items={[{text: 'test'}]} className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

describe('When including microdata', () => {
    test('List container element has microdata attributes', () => {
        const wrapper = shallow(<Breadcrumbs items={[{text: 'test'}]} includeMicroData={true} />)

        expect(wrapper.find('ol[itemScope=true]')).toHaveLength(1)
        expect(wrapper.find('ol[itemType="http://schema.org/BreadcrumbList"]')).toHaveLength(1)
    })

    test('Each list item has microdata attributes', () => {
        const items = [{text: 'test'}, {text: 'test2'}]

        const wrapper = shallow(<Breadcrumbs items={items} includeMicroData={true} />)

        expect(wrapper.find('li[itemScope=true]')).toHaveLength(2)
        expect(wrapper.find('li[itemProp="itemListElement"]')).toHaveLength(2)
        expect(wrapper.find('li[itemType="http://schema.org/ListItem"]')).toHaveLength(2)
    })

    test('props passed correctly when includeMicroData set true', () => {
        const wrapper = shallow(
            <Breadcrumbs items={[{text: 'test'}]} className={name} includeMicroData={true} />
        )

        expect(wrapper.find('.pw-breadcrumbs__list').props().itemType).toBe(
            'http://schema.org/BreadcrumbList'
        )
    })

    test('if a URL is included for an item, the url itemProp is rendered', () => {
        const wrapper = shallow(
            <Breadcrumbs items={[{text: 'test', href: '/test.html'}]} includeMicroData={true} />
        )
        const urlItemProp = wrapper.find('.pw-breadcrumbs__link [itemProp="url"]')
        expect(urlItemProp.length).toBe(1)
    })

    test('if a URL is not included for an item, the url itemProp is not rendered', () => {
        const wrapper = shallow(<Breadcrumbs items={[{text: 'test'}]} includeMicroData={true} />)
        const urlItemProp = wrapper.find('.pw-breadcrumbs__non-link [itemProp="url"]')
        expect(urlItemProp.length).toBe(0)
    })
})
