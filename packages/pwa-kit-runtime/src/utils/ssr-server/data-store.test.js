/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    DataStore,
    DataStoreNotFoundError,
    DataStoreServiceError,
    DataStoreUnavailableError
} from './data-store'

jest.mock('./utils', () => ({
    logMRTError: jest.fn()
}))

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn()
}))

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn()
    },
    GetCommand: jest.fn()
}))

import {logMRTError} from './utils'
import {DynamoDBClient} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient, GetCommand} from '@aws-sdk/lib-dynamodb'

describe('DataStore', () => {
    let mockSend
    let originalEnv

    beforeEach(() => {
        // Save original environment variables
        originalEnv = {...process.env}
        DataStore._instance = null

        // Mock DynamoDB client
        mockSend = jest.fn()
        DynamoDBDocumentClient.from.mockReturnValue({
            send: mockSend
        })

        // Default to the data store being available
        process.env.AWS_REGION = 'ca-central-1'
        process.env.MOBIFY_PROPERTY_ID = 'my-project'
        process.env.DEPLOY_TARGET = 'my-target'
    })

    afterEach(() => {
        // Restore original environment variables
        process.env = originalEnv

        // Reset singleton
        DataStore._instance = null

        jest.clearAllMocks()
    })

    describe('getDataStore', () => {
        test('should return singleton instance', () => {
            const store1 = DataStore.getDataStore()
            const store2 = DataStore.getDataStore()

            expect(store1).toBe(store2)
            expect(store1).toBeInstanceOf(DataStore)
        })
    })

    describe('isDataStoreAvailable', () => {
        test('should return true when all required env vars are set', () => {
            const store = DataStore.getDataStore()
            expect(store.isDataStoreAvailable()).toBe(true)
        })

        test.each(['AWS_REGION', 'MOBIFY_PROPERTY_ID', 'DEPLOY_TARGET'])(
            'should return false when %s is missing',
            (environmentVariableName) => {
                delete process.env[environmentVariableName]

                const store = DataStore.getDataStore()

                expect(store.isDataStoreAvailable()).toBe(false)
            }
        )
    })

    describe('getEntry', () => {
        test.each(['AWS_REGION', 'MOBIFY_PROPERTY_ID', 'DEPLOY_TARGET'])(
            'should throw DataStoreUnavailableError when %s is missing',
            async (environmentVariableName) => {
                delete process.env[environmentVariableName]

                const store = DataStore.getDataStore()

                await expect(store.getEntry('my-key')).rejects.toThrow(
                    new DataStoreUnavailableError('The data store is unavailable.')
                )
            }
        )

        test.each([
            {Item: {value: {}}},
            {Item: {value: {theme: 'dark'}}},
            {Item: {value: {nested: {theme: 'light'}}}}
        ])('should return entry when value exists', async (mockValue) => {
            mockSend.mockResolvedValue(mockValue)

            const store = DataStore.getDataStore()
            const result = await store.getEntry('my-key')

            expect(result).toEqual({key: 'my-key', value: mockValue.Item.value})
            expect(DynamoDBClient).toHaveBeenCalledWith({region: 'ca-central-1'})
            expect(mockSend).toHaveBeenCalledTimes(1)
            expect(GetCommand).toHaveBeenCalledWith({
                TableName: 'DataAccessLayer-ca-central-1',
                Key: {
                    projectEnvironment: 'my-project my-target',
                    key: 'my-key'
                }
            })
        })

        test.each([
            {},
            {Item: {}},
            {Item: {key: 'my-key'}},
            {Item: {value: null}},
            {Item: {value: undefined}}
        ])(
            'should throw DataStoreNotFoundError when value not found or is null/undefined',
            async (mockValue) => {
                mockSend.mockResolvedValue(mockValue)

                const store = DataStore.getDataStore()

                await expect(store.getEntry('my-key')).rejects.toThrow(
                    new DataStoreNotFoundError("Data store entry 'my-key' not found.")
                )
            }
        )

        test('should throw DataStoreServiceError and log internal error when send throws', async () => {
            const dynamoError = new Error('DynamoDB throttled')
            mockSend.mockRejectedValue(dynamoError)

            const store = DataStore.getDataStore()

            await expect(store.getEntry('my-key')).rejects.toThrow(
                new DataStoreServiceError('Data store request failed.')
            )
            expect(logMRTError).toHaveBeenCalledWith('data_store', dynamoError, {
                key: 'my-key',
                tableName: 'DataAccessLayer-ca-central-1'
            })
        })
    })
})

describe('DataStoreUnavailableError', () => {
    test('should have correct name and message', () => {
        const err = new DataStoreUnavailableError('the data store is unavailable')
        expect(err.name).toBe('DataStoreUnavailableError')
        expect(err.message).toBe('the data store is unavailable')
        expect(err).toBeInstanceOf(Error)
    })
})

describe('DataStoreNotFoundError', () => {
    test('should have correct name and message', () => {
        const err = new DataStoreNotFoundError('entry not found')
        expect(err.name).toBe('DataStoreNotFoundError')
        expect(err.message).toBe('entry not found')
        expect(err).toBeInstanceOf(Error)
    })
})

describe('DataStoreServiceError', () => {
    test('should have correct name and message', () => {
        const err = new DataStoreServiceError('this request failed')
        expect(err.name).toBe('DataStoreServiceError')
        expect(err.message).toBe('this request failed')
        expect(err).toBeInstanceOf(Error)
    })
})
