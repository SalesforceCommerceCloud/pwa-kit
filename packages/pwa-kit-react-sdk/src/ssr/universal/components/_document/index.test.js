/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {shallow} from 'enzyme'
import Document from './index'

describe('Document', () => {
    test('Renders correctly', () => {
        const style = <link key="stylesheet" rel="stylesheet" href="style.css" />
        const script = <script key="script" src="script.js" />
        const sprite = <svg id="__SVG_SPRITE_NODE__"></svg>
        const html = '<p>Hello world</p>'
        const bodyAttributes = {className: 'root'}
        const htmlAttributes = {lang: 'en'}
        const wrapper = shallow(
            <Document
                head={[style]}
                html={html}
                afterBodyStart={[sprite]}
                beforeBodyEnd={[script]}
                htmlAttributes={htmlAttributes}
                bodyAttributes={bodyAttributes}
            />
        )
        expect(wrapper.contains(sprite)).toBe(true)
        expect(wrapper.contains(style)).toBe(true)
        expect(wrapper.contains(script)).toBe(true)
        expect(wrapper.html().includes(html)).toBe(true)
        expect(wrapper.html().includes('<body class="root">')).toBe(true)
        expect(wrapper.html().includes('<html lang="en">')).toBe(true)
    })
})
