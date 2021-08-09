/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

'use strict'

const path = require('path')
const Utils = require('./utils')
const requestPromise = require('request-promise')

const makeRequest = (requestOptions) => {
    // console.log(requestOptions)
    return requestPromise(requestOptions)
        .then((response) => {
            return JSON.parse(response)
        })
        .catch((error) => {
            // console.log(error)
            if (error.name === 'StatusCodeError') {
                switch (error.statusCode) {
                    case 401:
                        throw new Error(Utils.requestErrorMessage.code401)
                    case 403:
                        throw new Error(Utils.requestErrorMessage.code403)
                    case 404:
                        throw new Error(Utils.requestErrorMessage.code404)
                    default:
                        if (error.statusCode >= 500) {
                            throw new Error(Utils.requestErrorMessage.code500)
                        }
                }
            }
            throw error
        })
}

const getTargetListRequest = (options) => {
    // e.g. https://cloud.mobify.com/api/projects/progressive-web-scaffold/target/
    /* eslint-disable prefer-template */
    const uri = options.origin + path.join('api/projects', options.projectSlug, 'target', '/')
    // For authorization, add authorization: "Bearer <api_token>" to the header
    /* eslint-enable prefer-template */
    const headers = Utils.getRequestHeaders({authorization: `Bearer ${options.api_key}`})
    const requestOptions = {
        uri,
        method: 'GET',
        headers
    }
    return makeRequest(requestOptions)
}

// The readTargetInfoRequest only works for one target, if we want to read the info of multiple targets, we need to
// use the getTargetListRequest to get the info of all the targets and then filter the results to only show the ones
// we are interested.
const readTargetInfoRequest = (options) => {
    // e.g. https://cloud.mobify.com/api/projects/progressive-web-scaffold/target/production
    /* eslint-disable prefer-template */
    const uri =
        options.origin +
        path.join('api/projects', options.projectSlug, 'target', options.target, '/')
    // For authorization, add 'authorization: "Bearer <api_token>"' to the header
    /* eslint-enable prefer-template */
    const headers = Utils.getRequestHeaders({authorization: `Bearer ${options.api_key}`})

    const requestOptions = {
        uri,
        method: 'GET',
        headers
    }
    return makeRequest(requestOptions)
}

module.exports = {
    getTargetListRequest,
    readTargetInfoRequest
}
