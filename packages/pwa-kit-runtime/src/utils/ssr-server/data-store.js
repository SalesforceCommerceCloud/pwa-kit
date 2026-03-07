/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {logMRTError} from './utils'

export class DataStoreNotFoundError extends Error {
    constructor(message) {
        super(message)
        this.name = 'DataStoreNotFoundError'
        Object.setPrototypeOf(this, DataStoreNotFoundError.prototype)
    }
}

export class DataStoreServiceError extends Error {
    constructor(message) {
        super(message)
        this.name = 'DataStoreServiceError'
        Object.setPrototypeOf(this, DataStoreServiceError.prototype)
    }
}

export class DataStoreUnavailableError extends Error {
    constructor(message) {
        super(message)
        this.name = 'DataStoreUnavailableError'
        Object.setPrototypeOf(this, DataStoreUnavailableError.prototype)
    }
}

/**
 * A class for reading entries from the data store.
 *
 * This class uses a singleton pattern.
 * Use DataStore.getDataStore() to get the singleton instance.
 */
export class DataStore {
    _tableName = ''
    _ddb = null
    static _instance = null

    /**
     * Private constructor for singleton use DataStore.getDataStore() instead.
     *
     * @private
     */
    constructor() {
        // Private constructor for singleton use DataStore.getDataStore() instead.
    }

    /**
     * Get or create a DynamoDB document client (for abstraction of attribute values).
     *
     * @private
     * @returns The DynamoDB document client
     * @throws {DataStoreUnavailableError} The data store is unavailable
     */
    _getClient() {
        if (!this.isDataStoreAvailable()) {
            throw new DataStoreUnavailableError('The data store is unavailable.')
        }

        if (!this._ddb) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const {DynamoDBClient} = require('@aws-sdk/client-dynamodb')
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const {DynamoDBDocumentClient} = require('@aws-sdk/lib-dynamodb')

            this._tableName = `DataAccessLayer-${process.env.AWS_REGION}`
            this._ddb = DynamoDBDocumentClient.from(
                new DynamoDBClient({
                    region: process.env.AWS_REGION
                })
            )
        }

        return this._ddb
    }

    /**
     * Get or create the singleton DataStore instance.
     *
     * @returns The singleton DataStore instance
     */
    static getDataStore() {
        if (!DataStore._instance) {
            DataStore._instance = new DataStore()
        }
        return DataStore._instance
    }

    /**
     * Whether the data store can be used in the current environment.
     *
     * @returns true if the data store is available, false otherwise
     */
    isDataStoreAvailable() {
        return Boolean(
            process.env.AWS_REGION && process.env.MOBIFY_PROPERTY_ID && process.env.DEPLOY_TARGET
        )
    }

    /**
     * Fetch an entry from the data store.
     *
     * @param key The data store entry's key
     * @returns An object containing the entry's key and value
     * @throws {DataStoreUnavailableError} The data store is unavailable
     * @throws {DataStoreNotFoundError} An entry with the given key cannot be found
     * @throws {DataStoreServiceError} An internal error occurred
     */
    async getEntry(key) {
        if (!this.isDataStoreAvailable()) {
            throw new DataStoreUnavailableError('The data store is unavailable.')
        }

        const ddb = this._getClient()
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {GetCommand} = require('@aws-sdk/lib-dynamodb')

        let response
        try {
            response = await ddb.send(
                new GetCommand({
                    TableName: this._tableName,
                    Key: {
                        projectEnvironment: `${process.env.MOBIFY_PROPERTY_ID} ${process.env.DEPLOY_TARGET}`,
                        key
                    }
                })
            )
        } catch (error) {
            logMRTError('data_store', error, {key, tableName: this._tableName})
            throw new DataStoreServiceError('Data store request failed.')
        }

        if (!response.Item?.value) {
            throw new DataStoreNotFoundError(`Data store entry '${key}' not found.`)
        }

        return {key, value: response.Item.value}
    }
}
