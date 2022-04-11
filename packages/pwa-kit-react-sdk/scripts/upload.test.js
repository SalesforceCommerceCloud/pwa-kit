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

test('uploadBundle fails with no options, no project slug, or empty project slug', () => {
    ;[undefined, {}, {projectSlug: ''}].forEach((options) => {
        Utils.fail.mockClear()
        Utils.fail.mockImplementationOnce(() => {
            throw new Error()
        })

        try {
            uploadBundle(options)
        } catch (e) {
            // Ignore
        }
        expect(Utils.fail).toBeCalledWith(
            '[Error: You must provide a Runtime Admin project slug to upload a bundle.]'
        )
    })
})

test("calls Utils.exists to check for the bundle's existence", () => {
    Utils.createBundle.mockClear()
    Utils.createBundle.mockReturnValueOnce(Promise.resolve())

    Utils.exists.mockClear()
    Utils.exists.mockReturnValueOnce(Promise.reject())

    Utils.buildObject.mockClear()

    return uploadBundle({projectSlug: 'mobify-test'})
        .catch(() => true)
        .then(() => {
            expect(Utils.createBundle).toBeCalled()
            expect(Utils.exists).toBeCalled()
            expect(Utils.exists.mock.calls[0][0]).toBe('build.tar')
            expect(Utils.buildObject).not.toBeCalled()
        })
})

test('the default options cannot be overwritten', async () => {
    Utils.createBundle.mockClear()
    Utils.createBundle.mockReturnValue(Promise.reject())

    try {
        await uploadBundle({target: 'dev'})
    } catch (err) {
        const outputTarget = Utils.createBundle.mock.calls[0][0].target
        expect(outputTarget).toBe('dev')
    }

    try {
        await uploadBundle()
    } catch (err) {
        const outputTarget = Utils.createBundle.mock.calls[1][0].target
        const defaultTargetValue = '' // see OPTION_DEFAULTS in ./upload.js
        expect(outputTarget).toBe(defaultTargetValue)
    }

    Utils.createBundle.mockReset()
})
