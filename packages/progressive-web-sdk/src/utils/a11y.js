/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// Helper object to quickly and clearly indicate keyCodes
export const keyMap = {
    // Focus
    tab: 9,
    // Navigation
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    // Action
    enter: 13,
    escape: 27,
    space: 32
}

// Helper method to ensure keyboard can trigger onClick event
export const onKeyUpHelper = (event, onClick, keycode, otherArgs = []) => {
    // Default key is (space)
    if (event.keyCode === keycode || event.keyCode === keyMap.space) {
        if (typeof onClick === 'function') {
            onClick(event, ...otherArgs)
        }
    }
}

// HOF to make using onKeyUpHelper easier
export const onKeyUpWrapper = (onClick, keycode) => (event, ...otherArgs) =>
    onKeyUpHelper(event, onClick, keycode, otherArgs)
