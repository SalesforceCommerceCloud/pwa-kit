/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

jest.mock('request')
jest.mock('./utils')

const Request = require('request')
const Utils = require('./utils')

const buildRequest = require('./build-request')

test('correctly makes a request', () => {
    Request.mockClear()
    Request.mockImplementation((options, callback) => {
        callback(null, {}, '')
    })

    Utils.getRequestHeaders.mockClear()
    const headerMock = {test: true}
    Utils.getRequestHeaders.mockReturnValueOnce(headerMock)

    return buildRequest(
        {
            origin: 'https://test.mobify.com',
            projectSlug: 'progressive-web-sdk-tests',
            dataLength: 12345,
            username: 'space-whales',
            api_key: 'KEY'
        },
        {}
    ).then(() => {
        expect(Request).toBeCalled()
        const options = Request.mock.calls[0][0]
        expect(options.uri.toString()).toBe(
            'https://test.mobify.com/api/projects/progressive-web-sdk-tests/builds/'
        )
        expect(options.method).toBe('POST')

        expect(Utils.getRequestHeaders).toBeCalled()
        expect(Utils.getRequestHeaders.mock.calls[0][0]['Content-Length']).toBe(12345)
        expect(options.headers).toBe(headerMock)
        expect(options.auth).toEqual({user: 'space-whales', pass: 'KEY'})
    })
})

test('passes back the parsed json body', () => {
    const result = {
        test: 1,
        api: 'bundles',
        progressive: '-web-sdk'
    }

    Request.mockClear()
    Request.mockImplementation((options, callback) => {
        callback(null, {}, JSON.stringify(result))
    })

    return buildRequest(
        {
            origin: 'https://test.mobify.com',
            projectSlug: 'progressive-web-sdk-tests'
        },
        {}
    ).then((output) => {
        expect(output).toEqual(result)
    })
})

test('calls Fail if there is a non-null error', () => {
    Request.mockClear()
    Request.mockImplementation((options, callback) => {
        callback({message: 'Error!'}, {}, '')
    })
    Utils.fail.mockClear()

    buildRequest(
        {
            origin: 'https://test.mobify.com',
            projectSlug: 'progressive-web-sdk-tests'
        },
        {}
    )

    expect(Utils.fail).toBeCalledWith('Error!')
})

test('calls Fail if the response has an error code', () => {
    const response = {code: 500}
    Request.mockImplementation((options, callback) => {
        callback(null, response, '')
    })
    Utils.fail.mockClear()
    Utils.errorForStatus.mockClear()
    Utils.errorForStatus.mockReturnValueOnce({message: 'Internal Server Error'})

    buildRequest(
        {
            origin: 'https://test.mobify.com',
            projectSlug: 'progressive-web-sdk-tests'
        },
        {}
    )

    expect(Utils.fail).toBeCalledWith('Internal Server Error')
    expect(Utils.errorForStatus).toBeCalledWith(response)
})
