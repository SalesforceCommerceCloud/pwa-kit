/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// Polyfills needed for IE 11 support

const removePolyfill = (arr) => {
    // Node remove Polyfill
    // https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove#Polyfill
    arr.forEach((item) => {
        if (item.hasOwnProperty('remove')) {
            return
        }
        Object.defineProperty(item, 'remove', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                if (this.parentNode !== null) {
                    this.parentNode.removeChild(this)
                }
            }
        })
    })
}

const eventPolyfill = () => {
    // Polyfill for CustomEvent() constructor, for use if Event constructor doesn't exist
    // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
    if (typeof window.CustomEvent === 'function') {
        return
    }

    class CustomEvent {
        constructor(event, params) {
            params = params || {bubbles: false, cancelable: false, detail: undefined}
            const evt = document.createEvent('CustomEvent')
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
            return evt
        }
    }

    CustomEvent.prototype = window.Event.prototype

    window.CustomEvent = CustomEvent
}

const arrayIncludesPolyfill = () => {
    // Polyfill for Array.prototype.includes
    // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
    if (!Array.prototype.includes) {
        Object.defineProperty(Array.prototype, 'includes', {
            // eslint-disable-line no-extend-native
            value(searchElement, fromIndex) {
                if (this === null) {
                    throw new TypeError('"this" is null or not defined')
                }

                // 1. Let O be ? ToObject(this value).
                const o = Object(this)

                // 2. Let len be ? ToLength(? Get(O, "length")).
                const len = o.length || 0

                // 3. If len is 0, return false.
                if (len === 0) {
                    return false
                }

                // 4. Let n be ? ToInteger(fromIndex).
                //    (If fromIndex is undefined, this step produces the value 0.)
                const n = fromIndex || 0

                // 5. If n ≥ 0, then
                //  a. Let k be n.
                // 6. Else n < 0,
                //  a. Let k be len + n.
                //  b. If k < 0, let k be 0.
                let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0)

                const sameValueZero = (x, y) => {
                    return (
                        x === y ||
                        (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y))
                    )
                }

                // 7. Repeat, while k < len
                while (k < len) {
                    // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                    // b. If SameValueZero(searchElement, elementK) is true, return true.
                    if (sameValueZero(o[k], searchElement)) {
                        return true
                    }
                    // c. Increase k by 1.
                    k++
                }

                // 8. Return false
                return false
            }
        })
    }
}

export const applyPolyfills = () => {
    arrayIncludesPolyfill()
    eventPolyfill()
    removePolyfill([Element.prototype, CharacterData.prototype, DocumentType.prototype])
}
