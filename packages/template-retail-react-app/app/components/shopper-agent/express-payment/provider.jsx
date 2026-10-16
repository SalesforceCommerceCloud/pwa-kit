/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Application-owned replacement point. This contract-test provider is temporary;
// Salesforce Payments will become the default after the shell contract is verified.
export {default} from './contract-test-provider'
