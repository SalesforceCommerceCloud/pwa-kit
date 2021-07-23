/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
            '[Error: You must provide a Mobify Cloud project slug to upload a bundle.]'
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
