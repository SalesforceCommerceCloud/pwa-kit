/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * We can't change window properties within Jest right now, so this is a
 * workaround (see @url: https://github.com/tmpvar/jsdom/issues/1622)
 * Jest test files are all run in their own environment, so we get a fresh window
 * object (and environment in general) by creating a new test file
 */
import FrameBridge from './parent'

test('constructor called with debug on creates iframe that is visible', () => {
    const frame = new FrameBridge({
        // eslint-disable-line no-new
        debug: true
    })

    const iframe = frame.childFrame
    expect(iframe.style.height).toBe('600px')
    expect(iframe.style.width).toBe('100%')
})
