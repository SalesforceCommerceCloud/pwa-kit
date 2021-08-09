import jsdom from 'jsdom'
import ReactPropTypesSecret from 'prop-types/lib/ReactPropTypesSecret'
import nock from 'nock'

/**
 * Use this flag to see if the test run is an integration test or not.
 *
 * You might use this in tests to switch between generating randomized vs.
 * stable inputs to functions under test. Typically, if you are doing a
 * playback-record test, you want the inputs to be stable in order to match
 * a recorded API response.
 *
 * @private
 */
export const isIntegrationTest = process.env.TEST_TYPE === 'integration'
nock.back.setMode(isIntegrationTest ? 'wild' : 'record')
nock.back.fixtures = `${__dirname}/../../cassettes`

/**
 * @private
 */
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}

/**
 * Conditionally record API responses to a cassette, based on
 * the TEST_TYPE flag. The cassette name is derived from the test.
 *
 * Eg.
 *
 * const spec = test('Test something', () => {
 *   return record(spec, () => {
 *     // ...test here
 *   })
 * })
 *
 * @private
 */
export const record = (spec, fn) =>
    new Promise((resolve, reject) => {
        nock.back(`${slugify(spec.getFullName())}.json`, (nockDone) => {
            const val = fn()
            const isPromise = (x) => x && x.then
            const promise = isPromise(val) ? val : Promise.resolve()
            promise.then((res) => {
                nockDone()
                resolve(res)
            })
            promise.catch((err) => {
                nockDone()
                reject(err)
            })
        })
    })

/**
 * @private
 */
export const getWindow = (url) =>
    jsdom.JSDOM.fromURL(url, {
        virtualConsole: new jsdom.VirtualConsole()
    }).then((dom) => dom.window)

/**
 * Perform prop-type validation and return the error strings as an Array
 * or undefined, if there were no errors.
 *
 * @private
 *
 * @param spec {Object} The prop type spec
 * @param value {Object} The value to validate
 * @returns (string[]|undefined)
 */
export const propTypeErrors = (spec, value) => {
    const getError = (key) => {
        let error

        if (typeof spec[key] !== 'function') {
            throw new Error(`Invalid type spec at ${key} - expected a function`)
        }
        try {
            error = spec[key](value, key, 'assertion', '', '', ReactPropTypesSecret)
        } catch (ex) {
            error = ex
        }
        return (
            error &&
            (!(error instanceof Error)
                ? 'Invalid type spec - function must return `null` or an `Error`'
                : `Failed prop type: ${key} ${error.message}`)
        )
    }
    const keys = Object.keys(spec)
    if (keys.length === 0) {
        return [new Error('Invalid type spec - expected at least one key')]
    }
    const errors = keys.map(getError).filter((x) => Boolean(x))
    return errors.length > 0 ? errors : undefined
}
