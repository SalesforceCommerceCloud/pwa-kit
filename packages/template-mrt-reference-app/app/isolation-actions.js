/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */

const {LambdaClient, InvokeCommand} = require('@aws-sdk/client-lambda')
const {S3Client, GetObjectCommand} = require('@aws-sdk/client-s3')
const {CloudWatchLogsClient, PutLogEventsCommand} = require('@aws-sdk/client-cloudwatch-logs')

export const isolationOriginLambdaTest = async (input) => {
    const client = new LambdaClient()
    try {
        await client.send(new InvokeCommand(input))
    } catch (e) {
        if (e.name === 'AccessDeniedException') {
            return true
        }
        console.error(e)
    }
    console.error('Lambda isolation test failed!')
    return false
}

export const isolationS3Test = async (input) => {
    const client = new S3Client({region: 'us-east-1'})
    try {
        await client.send(new GetObjectCommand(input))
    } catch (e) {
        if (e.name === 'AccessDenied') {
            return true
        }
        console.error(e)
    }
    console.error('S3 isolation test failed!')
    return false
}

export const isolationLogsTest = async (input) => {
    const client = new CloudWatchLogsClient()
    try {
        const inputValues = {
            ...input,
            logEvents: [
                {
                    timestamp: Date.now(),
                    message: 'This is plastic'
                }
            ]
        }
        await client.send(new PutLogEventsCommand(inputValues))
    } catch (e) {
        if (e.name === 'AccessDeniedException') {
            return true
        }
        console.error(e)
    }
    console.error('Log group isolation test failed!')
    return false
}

export const executeIsolationTests = async (params) => {
    const tests = [
        {name: 'origin', keys: ['FunctionName'], fn: isolationOriginLambdaTest},
        {name: 'storage', keys: ['Bucket', 'Key'], fn: isolationS3Test},
        {name: 'logs', keys: ['logGroupName', 'logStreamName'], fn: isolationLogsTest}
    ]
    let results = {}
    for (const test of tests) {
        const {keys, fn, name} = test
        const input = Object.keys(params)
            .filter((key) => keys.includes(key))
            .reduce((obj, key) => {
                obj[key] = params[key]
                return obj
            }, {})
        results[name] = await fn(input)
    }
    return results
}

export const isolationTests = async (req, res) => {
    const results = await executeIsolationTests(req.query)
    res.header('Content-Type', 'application/json')
    res.send(JSON.stringify(results, null, 4))
}
