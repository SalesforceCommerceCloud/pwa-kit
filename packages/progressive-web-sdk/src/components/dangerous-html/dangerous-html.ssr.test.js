/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {render} from 'enzyme'
import React from 'react'
import DangerousHTML from './index.jsx'

test('DangerousHTML renders server-side without errors', () => {
    expect(() => {
        render(
            <DangerousHTML html="test" enableExternalResources>
                {(htmlObj) => <div dangerouslySetInnerHTML={htmlObj} />}
            </DangerousHTML>
        )
    }).not.toThrow()
})
