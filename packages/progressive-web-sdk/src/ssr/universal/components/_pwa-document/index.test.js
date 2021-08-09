/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {shallow} from 'enzyme'
import PWADocument from './index'

describe('PWA Document', () => {
    test('Renders correctly', () => {
        const style = <link key="stylesheet" rel="stylesheet" href="style.css" />
        const script = <script key="script" src="script.js" />
        const html = '<p>Hello world</p>'
        const bodyAttributes = {className: 'root'}
        const htmlAttributes = {lang: 'en', amp: undefined}
        const wrapper = shallow(
            <PWADocument
                head={[style]}
                html={html}
                beforeBodyEnd={[script]}
                htmlAttributes={htmlAttributes}
                bodyAttributes={bodyAttributes}
            />
        )
        expect(wrapper.contains(style)).toBe(true)
        expect(wrapper.contains(script)).toBe(true)
        expect(wrapper.html().includes(html)).toBe(true)
        expect(wrapper.html().includes('<body class="root">')).toBe(true)
        expect(wrapper.html().includes('<html lang="en">')).toBe(true)
    })
})
