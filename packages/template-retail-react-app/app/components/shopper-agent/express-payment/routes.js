/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const SHOPPER_AGENT_EXPRESS_PAYMENT_PATH_RE = /\/Payments-Express(?:Product)?\/?(?:\?|$)/

export const isShopperAgentExpressPaymentPath = (path = '') =>
    SHOPPER_AGENT_EXPRESS_PAYMENT_PATH_RE.test(path)
