/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const Utils = require('./utils')
const targetRequests = require('./target-request')

const DEFAULT_ORIGIN = process.env.CLOUD_API_BASE || 'https://cloud.mobify.com/'

const OPTION_DEFAULTS = {
    settingsFile: Utils.getSettingsPath(),
    origin: DEFAULT_ORIGIN,
    target: '',
    message: Utils.setDefaultMessage()
}

const getTargetList = (customOptions) => {
    const options = Object.assign(OPTION_DEFAULTS, customOptions)
    const credentialsPromise = Utils.readCredentials(options.settingsFile)
    return credentialsPromise.then((credentials) => {
        const requestOptions = {
            api_key: credentials.api_key,
            origin: options.origin,
            projectSlug: options.projectSlug,
            target: options.target
        }
        return targetRequests.getTargetListRequest(requestOptions)
    })
}

const getTargetInfo = (customOptions) => {
    const options = Object.assign(OPTION_DEFAULTS, customOptions)
    const credentialsPromise = Utils.readCredentials(options.settingsFile)
    return credentialsPromise.then((credentials) => {
        const requestOptions = {
            api_key: credentials.api_key,
            origin: options.origin,
            projectSlug: options.projectSlug,
            target: options.target
        }
        return targetRequests.readTargetInfoRequest(requestOptions)
    })
}

module.exports = {
    getTargetList,
    getTargetInfo
}
