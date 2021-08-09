/**
 * Cause any tests that use `console.error` to fail.
 */

global.console.error = (e) => {
    throw new Error(e)
}
