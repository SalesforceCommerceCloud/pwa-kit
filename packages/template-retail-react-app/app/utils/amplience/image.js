/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const getImageUrl = ({defaultHost, endpoint, name} = {}) => {
    if (defaultHost && endpoint && name) {
        return `https://${defaultHost}/i/${endpoint}/${name}`
    }
    return ''
}

export const getVideoUrl = ({defaultHost, endpoint, name} = {}) => {
    if (defaultHost && endpoint && name) {
        return `https://${defaultHost}/v/${endpoint}/${name}`
    }
    return ''
}
