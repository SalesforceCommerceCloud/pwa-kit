/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
const fs = require('fs')
const os = require('os')
const path = require('path')

const S3rver = require('s3rver')
const sinon = require('sinon')

import {PersistentCache} from './ssr-cache-utils'

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const localRemoteTestCases = [true, false]
const namespaceTestCases = [undefined, 'second']

/*
 This set of tests loops over using local and remote caches, and for each
 cache type, loops over two namespaces. Most tests start with a 'get' of
 the key used in the test, which verifies that keys from one namespace
 don't affect tests performed in a separate namespace.
 */
localRemoteTestCases.forEach((useLocalCache) => {
    const nameBase = `${useLocalCache ? 'Local' : 'Remote'} cache`

    describe(nameBase, () => {
        const sandbox = sinon.sandbox.create()
        const sendMetric = sandbox.stub()
        const testCache = new PersistentCache({
            useLocalCache,
            bucket: 'TestBucket',
            s3Endpoint: 'http://localhost:4568',
            accessKeyId: 'S3RVER',
            secretAccessKey: 'S3RVER',
            sendMetric: sendMetric
        })

        let mockS3Directory
        let s3

        beforeAll((done) => {
            if (!useLocalCache) {
                mockS3Directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mockS3'))
                s3 = new S3rver({
                    directory: mockS3Directory,
                    resetOnClose: true,
                    // Set this to false to get more verbose logging
                    // from the S3 emulator
                    silent: true,
                    configureBuckets: [
                        {
                            name: 'TestBucket'
                        }
                    ]
                })
                return s3.run(done)
            } else {
                done()
            }
        })

        afterAll(() => {
            if (!useLocalCache) {
                if (s3) {
                    s3.close()
                    s3 = undefined
                }
                fs.rmdirSync(mockS3Directory)
                mockS3Directory = undefined
            }
        })

        namespaceTestCases.forEach((namespace) => {
            const name = `${namespace || 'default'} namespace,`

            describe(name, () => {
                test(`${name} set/get buffer`, () => {
                    const buf = Buffer.alloc(128)
                    for (let i = 0; i <= 128; i++) {
                        buf[i] = i
                    }

                    const key = 'abc'
                    const expiration = Date.now() + 10000

                    return testCache
                        .get({key, namespace})
                        .then((result) => {
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toBeUndefined()
                            expect(result.found).toBe(false)
                            expect(result.key).toEqual(key)
                            expect(result.namespace).toEqual(namespace)
                            return testCache.put({key, namespace, data: buf, expiration})
                        })
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => {
                            expect(result).toBeDefined()
                            expect(result.found).toBe(true)
                            expect(result.expiration).toEqual(expiration)
                            expect(result.key).toEqual(key)
                            expect(result.metadata).toBeUndefined()
                            const buf2 = result.data
                            expect(buf2).toBeDefined()
                            expect(buf2.equals(buf)).toBe(true)
                        })
                })

                test(`${name} set/get JSON`, () => {
                    const data = {
                        a: 1,
                        b: '2',
                        c: {
                            d: 'abcd'
                        },
                        e: [1, 2, 3, 4]
                    }
                    const metadata = {
                        x: 'x'
                    }

                    const key = 'xyz'
                    const expiration = Date.now() + 10000

                    return testCache
                        .get({key, namespace})
                        .then((result) => {
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toBeUndefined()
                            expect(result.found).toBe(false)
                            expect(result.key).toEqual(key)
                            expect(result.namespace).toEqual(namespace)
                            return testCache.put({key, namespace, data, metadata, expiration})
                        })
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => {
                            expect(result).toBeDefined()
                            expect(result.found).toBe(true)
                            expect(result.expiration).toEqual(expiration)
                            expect(result.key).toEqual(key)
                            expect(result.data).toEqual(data)
                            expect(result.metadata).toEqual(metadata)
                        })
                })

                test(`${name} set/get metadata only`, () => {
                    const metadata = {
                        xyz: '123'
                    }

                    const key = 'pqr'
                    const expiration = Date.now() + 10000

                    return testCache
                        .get({key, namespace})
                        .then((result) => {
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toBeUndefined()
                            expect(result.found).toBe(false)
                            expect(result.key).toEqual(key)
                            expect(result.namespace).toEqual(namespace)
                            return testCache.put({key, namespace, metadata, expiration})
                        })
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => {
                            expect(result).toBeDefined()
                            expect(result.found).toBe(true)
                            expect(result.expiration).toEqual(expiration)
                            expect(result.key).toEqual(key)
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toEqual(metadata)
                        })
                })

                test(`${name} set/get empty`, () => {
                    const key = 'stu'
                    const expiration = Date.now() + 10000

                    return testCache
                        .get({key, namespace})
                        .then((result) => {
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toBeUndefined()
                            expect(result.found).toBe(false)
                            expect(result.key).toEqual(key)
                            expect(result.namespace).toEqual(namespace)
                            return testCache.put({key, namespace, expiration})
                        })
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => {
                            expect(result).toBeDefined()
                            expect(result.found).toBe(true)
                            expect(result.expiration).toEqual(expiration)
                            expect(result.key).toEqual(key)
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toBe(undefined)
                        })
                })

                test(`${name} set with default expiration`, () => {
                    const key = 'jkl'
                    const oneYear = Date.now() + 365 * 24 * 3600 * 1000

                    return testCache
                        .get({key, namespace})
                        .then((result) => {
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toBeUndefined()
                            expect(result.found).toBe(false)
                            expect(result.key).toEqual(key)
                            expect(result.namespace).toEqual(namespace)
                            return testCache.put({key, namespace, data: '123'})
                        })
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => {
                            expect(result).toBeDefined()
                            expect(result.found).toBe(true)
                            expect(Math.abs(result.expiration - oneYear)).toBeLessThan(500)
                            expect(result.data).toEqual('123')
                            expect(result.key).toEqual(key)
                        })
                })

                test(`${name} delete existing`, () => {
                    const key = 'ghi'
                    const expiration = Date.now() + 10000

                    return testCache
                        .get({key, namespace})
                        .then((result) => {
                            expect(result.data).toBeUndefined()
                            expect(result.metadata).toBeUndefined()
                            expect(result.found).toBe(false)
                            expect(result.key).toEqual(key)
                            expect(result.namespace).toEqual(namespace)
                            return testCache.put({key, namespace, data: '0123456789', expiration})
                        })
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => expect(result).toBeDefined())
                        .then(() => testCache.delete({key, namespace}))
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => expect(result.found).toBe(false))
                        .then(() => testCache.delete({key, namespace}))
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => expect(result.found).toBe(false))
                })

                test(`${name} delete non-existing`, () => {
                    const key = 'nosuchkey'
                    return testCache
                        .get({key, namespace})
                        .then((result) => expect(result.found).toBe(false))
                        .then(() => testCache.delete({key, namespace}))
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => expect(result.found).toBe(false))
                })

                test(`${name} absolute expiration`, () => {
                    const key = 'def1'
                    const expiration = Date.now() + 250

                    return testCache
                        .put({key, namespace, data: '12345', expiration})
                        .then(() => sleep(500))
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => {
                            expect(result.found).toBe(false)
                            expect(result.data).toBeUndefined()
                        })
                })

                test(`${name} delta expiration`, () => {
                    const key = 'def2'
                    const expiration = 250

                    return testCache
                        .put({key, namespace, data: '12345', expiration})
                        .then(() => sleep(500))
                        .then(() => testCache.get({key, namespace}))
                        .then((result) => {
                            expect(result.found).toBe(false)
                            expect(result.data).toBeUndefined()
                        })
                })
            })
        })

        test('sanitize returns expected value', () => {
            const key = '/test/1/55c6759ac7fc71bf306199ad6fa407a1b5bd6ff2a2611d178b9add32f1cf4062'
            const namespace = 'namespace'
            if (useLocalCache) {
                expect(testCache._sanitize(key, namespace).s3Key).toBe(
                    `${namespace}${key}`.replace(/\//g, path.sep)
                )
                expect(testCache._sanitize(key, namespace).safeNamespace).toBe(
                    'namespace/test/1/'.replace(/\//g, path.sep)
                )
                expect(testCache._sanitize(key).s3Key).toBe(
                    key.substring(1).replace(/\//g, path.sep)
                )
                expect(testCache._sanitize(key).safeNamespace).toBe(
                    'test/1/'.replace(/\//g, path.sep)
                )
            } else {
                expect(testCache._sanitize(key, namespace).s3Key).toBe(`${namespace}${key}`)
                expect(testCache._sanitize(key, namespace).safeNamespace).toBe('namespace/test/1/')
                expect(testCache._sanitize(key).s3Key).toBe(key.substring(1))
                expect(testCache._sanitize(key).safeNamespace).toBe('test/1/')
            }
        })

        test('namespace construction', () => {
            let {safeNamespace, separator} = testCache._sanitize('x', 'ns')
            expect(safeNamespace).toEqual(`ns${separator}`)

            safeNamespace = testCache._sanitize('x', ['ns']).safeNamespace
            expect(safeNamespace).toEqual(`ns${separator}`)

            safeNamespace = testCache._sanitize('x', [undefined, 'ns1', '', 'ns2']).safeNamespace
            expect(safeNamespace).toEqual(`ns1${separator}ns2${separator}`)
        })

        test('namespaces are distinct', () => {
            const key = 'mno'

            const ns1 = ['a', '1']
            const ns2 = ['a', '2']

            return Promise.all([
                testCache.get({key, namespace: ns1}),
                testCache.get({key, namespace: ns2})
            ])
                .then(([one, two]) => {
                    expect(one.data).toBeUndefined()
                    expect(one.namespace).toEqual(ns1)
                    expect(two.data).toBeUndefined()
                    expect(two.namespace).toEqual(ns2)
                    return Promise.all([
                        testCache.put({key, namespace: ns1, data: 'one'}),
                        testCache.put({key, namespace: ns2, data: 'two'})
                    ])
                })
                .then(() =>
                    Promise.all([
                        testCache.get({key, namespace: ns1}),
                        testCache.get({key, namespace: ns2})
                    ])
                )
                .then(([one, two]) => {
                    expect(one.data).toEqual('one')
                    expect(one.namespace).toEqual(ns1)
                    expect(two.data).toEqual('two')
                    expect(two.namespace).toEqual(ns2)
                })
        })
    })
})

describe('Remote cache specific tests', () => {
    const sandbox = sinon.sandbox.create()

    test('non-functional', () => {
        const cache = new PersistentCache({useLocalCache: false, sendMetric: sandbox.stub()})
        expect(cache._functional).toBe(false)

        return cache
            .get({key: 'k'})
            .then((result) => {
                expect(result.found).toBe(false)
                return cache.put({key: 'k', data: '123'})
            })
            .then(() => cache.get({key: 'k'}))
            .then((result) => {
                expect(result.found).toBe(false)
                return cache.delete({key: 'k'})
            })
    })

    test('prefix', () => {
        const cache = new PersistentCache({
            useLocalCache: false,
            prefix: 'abc',
            bucket: 'TestBucket',
            sendMetric: sandbox.stub()
        })
        expect(cache._functional).toBe(true)

        const key = 'xyzzy'
        const namespace = 'plugh'
        const {s3Key, safeNamespace} = cache._sanitize(key, namespace)
        expect(safeNamespace).toEqual('abc/plugh/')
        expect(s3Key.startsWith(safeNamespace)).toBe(true)
    })
})

describe('Metrics Sending tests', () => {
    const sandbox = sinon.sandbox.create()
    const namespace = 'test123'

    afterEach(() => {
        sandbox.restore()
    })

    test('Sending Metrics for Cache Miss', () => {
        const sendMetric = sandbox.stub()
        const cache = new PersistentCache({useLocalCache: true, sendMetric: sendMetric})

        const data = {
            a: 1,
            b: '2',
            c: {
                d: 'abcd'
            },
            e: [1, 2, 3, 4]
        }
        const metadata = {
            x: 'x'
        }

        const key = 'xyz'
        const expiration = Date.now() + 10000

        return cache.get({key, namespace}).then(() => {
            expect(sendMetric.calledWith('ApplicationCacheRetrievalTimeHit')).toBe(false)
            expect(sendMetric.calledWith('ApplicationCacheRetrievalTimeMiss')).toBe(true)
            expect(sendMetric.calledWith('ApplicationCacheHitOccurred', 0)).toBe(true)
            return cache.put({key, namespace, data, metadata, expiration})
        })
    })

    test('Sending Metrics for Cache Storage and Retrival', () => {
        const sendMetric = sandbox.stub()
        const cache = new PersistentCache({useLocalCache: true, sendMetric: sendMetric})

        const data = {
            a: 1,
            b: '2',
            c: {
                d: 'abcd'
            },
            e: [1, 2, 3, 4]
        }
        const metadata = {
            x: 'x'
        }

        const key = 'xyz'
        const expiration = Date.now() + 10000

        return cache
            .put({key, namespace, data, metadata, expiration})
            .then(() => {
                expect(sendMetric.calledWith('ApplicationCacheStorageTime')).toBe(true)
                return cache.get({key, namespace})
            })
            .then(() => {
                expect(sendMetric.calledWith('ApplicationCacheRetrievalTimeHit')).toBe(true)
                expect(sendMetric.calledWith('ApplicationCacheRetrievalTimeMiss')).toBe(false)
                expect(sendMetric.calledWith('ApplicationCacheHitOccurred', 1)).toBe(true)
            })
    })

    test('Error thrown when sendMetrics not a function ', () => {
        const sendMetric = {a: 1}

        expect(() => {
            new PersistentCache({useLocalCache: true, sendMetric: sendMetric})
        }).toThrow()
    })

    test('Error thrown when sendMetrics not undefined ', () => {
        expect(() => {
            new PersistentCache({useLocalCache: true})
        }).toThrow()
    })
})

describe('Local cache specific tests', () => {
    const sandbox = sinon.sandbox.create()

    test('Cache cleaned correctly', () => {
        // First, create a cache directory for a process that will
        // never exist
        const fakeDir = fs.mkdtempSync(PersistentCache._cachePathForPID(999999))

        expect(fs.existsSync(fakeDir)).toBe(true)

        // Next, create a cache, and make sure it has a directory
        const cache = new PersistentCache({useLocalCache: true, sendMetric: sandbox.stub()})
        const cacheDir = cache._cachePath
        expect(fs.existsSync(cacheDir)).toBe(true)

        // Run the cleanup logic. We expect this to clean up
        // the fake directory, but leave the cache's directory.
        return PersistentCache._cleanupOnEntry().then(() => {
            // Check the results
            expect(fs.existsSync(fakeDir)).toBe(false)
            expect(fs.existsSync(cacheDir)).toBe(true)

            // Close the cache and check that it cleaned up
            cache.close()
            expect(fs.existsSync(cacheDir)).toBe(false)
        })
    })
})
