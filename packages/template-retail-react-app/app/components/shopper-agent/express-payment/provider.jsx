/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Opt-in provider; reports unavailable unless direct cart and Salesforce Payments
// CART express checkout are enabled and a current, bound cart launch is present.
export {default} from './providers/salesforce-express-payment-provider'
