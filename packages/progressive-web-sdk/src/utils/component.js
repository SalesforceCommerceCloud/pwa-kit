/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/component
 */

/**
 * The function returns a value with an upper bound and a lower bound.
 * @function
 * @param {number} value - the value to set for bounded vlue
 * @param {number} minimumValue - the minium value
 * @param {number} maximumValue - the maxium value
 * @returns {Number}
 * @example
 * import {getBoundedValue} from 'progressive-web-sdk/dist/utils/component'
 *
 * getBoundedValue(2, 5, 10) // 5
 */
export const getBoundedValue = (value, minimumValue, maximumValue) => {
    let nextValue = value
    if (minimumValue !== null) {
        nextValue = Math.max(nextValue, minimumValue)
    }
    if (maximumValue !== null) {
        nextValue = Math.min(nextValue, maximumValue)
    }
    return nextValue
}

/**
 * Display the name of the component
 * @function
 * @param {function} WrappedComponent - the name of the component
 * @returns {String}
 * @example
 * import {getDisplayName} from 'progressive-web-sdk/dist/utils/component'
 *
 * class AnotherMockComponent extends React.Component {
 *     render() {
 *          return (<div>More mock html</div>)
 *     }
 * }
 *
 * getDisplayName(AnotherMockComponent) // "AnotherMockComponent"
 */
export const getDisplayName = (WrappedComponent) => {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}
