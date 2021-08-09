/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/action-creation
 */
import {createAction as createReduxAction} from 'redux-actions'
import fromPairs from 'lodash.frompairs'
import {typecheck} from './typechecking'

/**
 * This function wraps the redux-actions `createAction` function. It takes
 * a description for the action (which must be unique!) and an array
 * of names that will be used for the parameters in the action.
 *
 * If no parameter names are passed in, the first argument (and only
 * the first argument) to the action creator will be used directly as
 * the payload.
 *
 * ---
 *
 * We can pass an optional meta creator function to createAction. This
 * function receives all of the arguments passed to the action
 * creator, including those used for the payload, and creates a meta
 * information object to be included in the action.
 *
 * Currently we use meta information in actions for analytics. See
 * `createActionWithAnalytics` below for a more convenient way to
 * build actions with analytics information.
 *
 * @function
 * @param {string} description - a unique name for the action
 * @param {array} payloadArgNames - an array of parameter names
 * @param {function} metaCreator - a meta creator
 * @returns {Function}
 *
 * @example
 * import {createAction} from 'progressive-web-sdk/dist/utils/action-creation'
 *
 * const addToCart = createAction('Add to cart', ['productId', 'quantity'])
 *
 * dispatch(addToCart(65536, 2))
 *
 * // dispatches an action with a payload of:
 * payload: {
 *     productId: 65536,
 *     quantity: 2
 * }
 */
export const createAction = (description, payloadArgNames, metaCreator) => {
    return createReduxAction(
        description,
        payloadArgNames && payloadArgNames.length
            ? (...args) => fromPairs(payloadArgNames.map((arg, idx) => [arg, args[idx]]))
            : null,
        metaCreator
    )
}

const createAnalyticsMeta = (type, payload) => ({
    analytics: {
        type,
        payload
    }
})

/**
 * This function acts like createAction but simplifies the creation of
 * the analytics meta payload. In addition to the action description
 * and the payload argument names, it takes an analytics event type
 * string and a function for creating the analytics payload.
 *
 * The analytics payload creator receives all of the argments to the
 * action creator, including all arguments included in the payload. In
 * this way, we can use the payload information as part of the
 * analytics payload, but also include additional information that is
 * not relevant for the main action.
 * @function
 * @param {string} description - a unique name for the action
 * @param {array} payloadArgNames - an array of parameter names
 * @param {string} analyticsType - the type string for the analytics event
 * @param {function} analyticsPayloadCreator - A function that returns the analytics payload.
 * @returns {Function}
 *
 * @example
 * import {createActionWithAnalytics} from 'progressive-web-sdk/dist/utils/action-creation'
 *
 * // Imagine we are running an A/B tes on the color of the add to
 * // cart button. The colour of the button is irrelevant to the actual
 * // process of adding to the cart, but it is relevant to the analytics
 * // that are tracking the results of the A-B test. We can define our
 * // action in the following way:
 *
 * const addToCart = createActionWithAnalytics(
 *     'Add to cart',
 *     ['id', 'quantity'],
 *     'cartAdd',
 *     (id, quantity, buttonColour) => ({id, quantity, buttonColour})
 * )
 *
 *  // and then dispatch it with:
 *
 *  dispatch(addToCart(15, 1, 'red'))
 *  // or
 *  dispatch(addToCart(15, 1, 'green'))
 *
 *  // This would result in an action object with the form:
 *  {
 *      type: 'Add to cart',
 *      payload: {id: 15, quantity: 1},
 *      meta: {
 *          analytics: {
 *              type: 'cartAdd',
 *              payload: {id: 15, quantity: 1, buttonColour: 'green'}
 *          }
 *      }
 *  }
 */

export const createActionWithAnalytics = (
    description,
    payloadArgNames,
    analyticsType,
    analyticsPayloadCreator
) => {
    return createAction(description, payloadArgNames, (...args) =>
        createAnalyticsMeta(
            analyticsType,
            analyticsPayloadCreator ? analyticsPayloadCreator(...args) : undefined
        )
    )
}

/**
 * Create an action creator that typechecks its argument.
 *
 * The action creator argument is passed unchanged as the payload if
 * no key is passed, while if a key is provided the action creator
 * argument is wrapped in an object under that key. This allows the
 * action to set a specific key within the Redux store using mergePayload.
 * @function
 * @param description {string} -  The description of the action (seen in dev tools)
 * @param type {Runtype} - The type to check the action argument against
 * @param key {string} - The key in the store to set with the payload
 * @returns {function} - The action creator.
 * @example
 * import {createTypedAction} from 'progressive-web-sdk/dist/utils/action-creation'
 */
export const createTypedAction = (description, type, key) =>
    createReduxAction(
        description,
        key
            ? (payload) => {
                  return {[key]: typecheck(type, payload)}
              }
            : (payload) => typecheck(type, payload)
    )
