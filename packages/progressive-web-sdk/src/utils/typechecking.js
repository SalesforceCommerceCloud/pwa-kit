/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/typecheck
 */

/**
 * Validates a value against a runtype. If the value does not match the provided
 * runtype, this function will still output the value, but it will also log a
 * "Type check failed" error to the console.
 *
 * @function
 * @param {object} type - A valid runtype instance. See runtypes for details: https://www.npmjs.com/package/runtypes
 * @param {*} value - The value being verified as the type provided by the type param
 * @returns {*} - Returns the value, as passed into the value param
 * @example
 * import {typecheck} from 'progressive-web-sdk/dist/utils/typechecking'
 * import {Number} from 'runtypes'
 *
 * const id = 'myId'
 * typecheck(Number, id) // => 'myId'
 * // This will log an error to the console:
 * //
 * //     "Type check failed: ${error}
 * //     Value: 'myId'"
 */
export const typecheck =
    process.env.NODE_ENV === 'production'
        ? /* istanbul ignore if */
          /* istanbul ignore next */ (type, value) => value
        : (type, value) => {
              try {
                  type.check(value)
              } catch (e) {
                  console.error('Type check failed: ', e, '\n\nValue: ', value)
              }
              return value
          }
