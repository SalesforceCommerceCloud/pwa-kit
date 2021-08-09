import * as types from '../types'

/**
 * React PropTypes write to console.error on import when they have been
 * misconfigured. Our tests are set to fail if anything logs to `console.error`
 * and this test should always pass otherwise.
 */

test('test for types', () => {
    expect(types.Store).toBe(types.Store)
})
