import * as utils from './utils'

describe.each([[true], [false]])('Utils (isRemote: %p)', (isRemote) => {
        let originalEnv
        const bundleId = 'test-bundle-id-12345'

        beforeEach(() => {
            originalEnv = process.env
            process.env = Object.assign({}, process.env)
            process.env.BUNDLE_ID = bundleId
            if (isRemote) {
                process.env.AWS_LAMBDA_FUNCTION_NAME = 'remote-test-name'
            }
        })

        afterEach(() => {
            process.env = originalEnv
        })

        test(`getBundleBaseUrl should return the correct URL`, () => {
            const expectedId = isRemote ? bundleId : 'development'
            const expected = `/mobify/bundle/${expectedId}/`
            expect(utils.getBundleBaseUrl()).toBe(expected)
        })

        test(`localDevLog should log conditionally`, () => {
            utils.localDevLog('foo')
        })
    })