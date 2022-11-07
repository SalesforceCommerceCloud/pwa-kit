/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

jest.mock('./build-request')
jest.mock('./utils')
const Utils = require('./utils')

const uploadBundle = require('./upload.js')

let realFail
beforeEach(() => {
    realFail = Utils.fail
    Utils.fail.mockImplementation((errorMessage) => {
        throw new Error(errorMessage)
    })
})

afterEach(() => {
    Utils.fail = realFail
})

const requiredOptions = {projectSlug: 'mobify-test', origin: 'https://cloud-test.mobify.com'}

test('uploadBundle fails with invalid options', () => {
    ;[
        undefined,
        {},
        {projectSlug: '', origin: requiredOptions.origin},
        {projectSlug: requiredOptions.projectSlug, origin: ''}
    ].forEach((options) => {
        try {
            uploadBundle(options)
        } catch (e) {
            expect(Utils.fail).toBeCalled()
            expect(e.message).toBe(
                '[Error: You must provide a Managed Runtime project slug and Cloud origin to upload a bundle.]'
            )
        }
    })
})

test("calls Utils.exists to check for the bundle's existence", () => {
    Utils.createBundle.mockClear()
    Utils.createBundle.mockReturnValueOnce(Promise.resolve())

    Utils.exists.mockClear()
    Utils.exists.mockReturnValueOnce(Promise.reject())

    Utils.buildObject.mockClear()

    return uploadBundle(requiredOptions)
        .catch(() => true)
        .then(() => {
            expect(Utils.createBundle).toBeCalled()
            expect(Utils.exists).toBeCalled()
            expect(Utils.exists.mock.calls[0][0]).toBe('build.tar')
            expect(Utils.buildObject).not.toBeCalled()
        })
})

test('the default options can be overwritten', async () => {
    Utils.createBundle.mockClear()
    Utils.createBundle.mockReturnValue(Promise.reject())

    try {
        await uploadBundle({target: 'dev', ...requiredOptions})
    } catch (err) {
        const outputTarget = Utils.createBundle.mock.calls[0][0].target
        expect(outputTarget).toBe('dev')
    }

    try {
        await uploadBundle(requiredOptions)
    } catch (err) {
        const outputTarget = Utils.createBundle.mock.calls[1][0].target
        const defaultTargetValue = '' // see OPTION_DEFAULTS in ./upload.js
        expect(outputTarget).toBe(defaultTargetValue)
    }

    Utils.createBundle.mockReset()
})
