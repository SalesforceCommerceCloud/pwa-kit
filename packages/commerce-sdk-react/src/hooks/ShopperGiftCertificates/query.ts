/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createUseQuery} from '../createUseQuery'
import {getGiftCertificate as getGiftCertificateQueryKeyHelper} from './queryKeyHelpers'

/**
 * Action to retrieve an existing gift certificate.
 * @group ShopperGiftCertificates
 * @category Query
 * @parameter apiOptions - Options to pass through to `commerce-sdk-isomorphic`, with `null` accepted for unset API parameters.
 * @parameter queryOptions - TanStack Query query options, with `enabled` by default set to check that all required API parameters have been set.
 * @returns A TanStack Query query hook with data from the Shopper Gift Certificates `getGiftCertificate` endpoint.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-gift-certificates?meta=getGiftCertificate| Salesforce Developer Center} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppergiftcertificates.shoppergiftcertificates-1.html#getgiftcertificate | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery | TanStack Query `useQuery` reference} for more information about the return value.
 */
export const useGiftCertificate = createUseQuery({
    clientKey: 'shopperGiftCertificates',
    methodName: 'getGiftCertificate',
    displayName: 'useGiftCertificate',
    queryKeyHelper: getGiftCertificateQueryKeyHelper
})
