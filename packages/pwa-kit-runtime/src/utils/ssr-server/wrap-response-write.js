/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const wrapResponseWrite = (response) => {
    const caching = response.locals.responseCaching
    caching.chunks = []
    const originalWrite = response.write
    /*
     * The ExpressJS response.write method can be passed a wide
     * range of types of object. A String is converted to a UTF-8 encoded
     * Buffer. Other non-Buffer types are stringified as JSON, which is
     * converted to a UTF-8 encoded Buffer. A Buffer is passed as-is.
     * Therefore this patch function should only ever receive
     * Buffer objects, and the encoding value should never be
     * specified. However, because there are many ways to send
     * a response, we add handling for string-encoding.
     */
    response.write = (chunk, encoding, callback) => {
        if (typeof chunk === 'string') {
            /* istanbul ignore next */
            encoding = typeof encoding === 'string' ? encoding : 'utf8'
            caching.chunks.push(Buffer.from(chunk, encoding))
        } else if (Buffer.isBuffer(chunk)) {
            caching.chunks.push(chunk)
        } else {
            throw new Error(`Object of unexpected type "${typeof chunk}" written to response`)
        }
        return originalWrite.call(response, chunk, encoding, callback)
    }
}
