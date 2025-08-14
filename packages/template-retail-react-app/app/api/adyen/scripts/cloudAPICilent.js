/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'
import {CloudAPIClient} from '@salesforce/pwa-kit-dev/utils/script-utils'

class CloudAPIClientCustom extends CloudAPIClient {
    constructor({projectID, environmentID, ...params}) {
        super(params)
        if (!projectID) throw new Error('projectID is not defined in .env file')
        if (!environmentID) throw new Error('environmentID is not defined in  .env file')
        this.projectID = projectID
        this.environmentID = environmentID
    }
    async pushEnv(env) {
        const pathname = `api/projects/${this.projectID}/target/${this.environmentID}/env-var/`
        const url = new URL(this.opts.origin)
        url.pathname = pathname

        const headers = {
            ...(await this.getHeaders()),
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
        const res = await this.opts.fetch(url.toString(), {
            env,
            method: 'PATCH',
            headers
        })
        await this.throwForStatus(res)
        return res
    }
    async getEnv() {
        const pathname = `api/projects/${this.projectID}/target/${this.environmentID}/env-var/`
        const url = new URL(this.opts.origin)
        url.pathname = pathname
        const headers = {
            ...(await this.getHeaders()),
            Accept: 'application/json'
        }
        const res = await this.opts.fetch(url.toString(), {
            method: 'GET',
            headers
        })
        await this.throwForStatus(res)
        return await res.json()
    }
}

export {CloudAPIClientCustom}
