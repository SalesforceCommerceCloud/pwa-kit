/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PersistentCache} from './ssr-cache'

const localRemoteTestCases = [true, false]

localRemoteTestCases.forEach((useLocalCache) => {
    describe(`${useLocalCache ? 'Local' : 'Remote'} noop PersistentCache`, () => {
        const testCache = new PersistentCache({
            useLocalCache,
            bucket: 'TestBucket',
            s3Endpoint: 'http://localhost:4568',
            accessKeyId: 'S3RVER',
            secretAccessKey: 'S3RVER',
            sendMetric: () => {}
        })
        const key = 'key'
        const namespace = 'namespace'
        const buf = Buffer.alloc(8)
        for (let i = 0; i <= 8; i++) {
            buf[i] = i
        }
        const expiration = Date.now() + 10000
        test('get', async () => {
            const result = await testCache.get({key, namespace})
            expect(result.data).toBeUndefined()
            expect(result.metadata).toBeUndefined()
            expect(result.found).toBe(false)
            expect(result.key).toEqual(key)
            expect(result.namespace).toEqual(namespace)
        })
        test('put', async () => {
            await testCache.put({key, namespace, data: buf, expiration})
            const result = await testCache.get({key, namespace})
            expect(result.data).toBeUndefined()
            expect(result.metadata).toBeUndefined()
            expect(result.found).toBe(false)
            expect(result.key).toEqual(key)
            expect(result.namespace).toEqual(namespace)
        })
        test('delete', async () => {
            await expect(testCache.delete({key, namespace})).resolves.not.toThrow()
        })
    })
})
