/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'

import Document from './index'

describe('Document', () => {
    test('Renders correctly', () => {
        const style = <link key="stylesheet" rel="stylesheet" href="style.css" />
        const script = <script key="script" src="script.js" />
        const sprite = <svg id="__SVG_SPRITE_NODE__"></svg>
        const html = '<p>Hello world</p>'
        const bodyAttributes = {className: 'root'}
        const htmlAttributes = {lang: 'en'}
        render(
            <Document
                head={[style]}
                html={html}
                afterBodyStart={[sprite]}
                beforeBodyEnd={[script]}
                htmlAttributes={htmlAttributes}
                bodyAttributes={bodyAttributes}
            />
        )
        const scriptTag = document.querySelector('script')
        const svgTag = document.querySelector('svg')
        const styleTag = document.querySelector('link')
        // by default, React Testing Library append the test component into a body tag, since our component is a full DOM
        // there will be two body tags in the DOM, we only want to check the second one
        const bodyTag = document.querySelectorAll('body')[1]
        // it looks like it returns two html collection, the first one is the React Testing library, the second one is our component we are testing
        const htmlTag = document.getElementsByTagName('html')[1]
        expect(svgTag).toBeInTheDocument()
        expect(scriptTag).toBeInTheDocument()
        expect(styleTag).toBeInTheDocument()
        expect(screen.getByText(/hello world/i)).toBeInTheDocument()
        expect(bodyTag).toHaveAttribute('class', 'root')
        expect(htmlTag).toHaveAttribute('lang', 'en')
    })
})
