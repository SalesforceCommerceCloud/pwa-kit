/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 *  This class connects to a custom hook endpoint as implemented by https://github.com/SalesforceCommerceCloud/sfcc-hooks-collection
 *  and can be used to retrieve customer groups for a given customer.
 *  This is not automatically configured by this project.

 *  Please be careful. The custom object API does not impose any security. So if you expose sensitive data, such
 *  as personal identifiable information or orders, please ensure secure access
 */

import {createOcapiFetch} from './utils'

class OcapiShopperCustomerGroups {
    constructor(config) {
        this.fetch = createOcapiFetch(config)
    }

    async getCustomerGroups(...args) {
        return await this.fetch('custom_objects/CustomApi/customer-groups', 'GET', args)
    }
}

export default OcapiShopperCustomerGroups
