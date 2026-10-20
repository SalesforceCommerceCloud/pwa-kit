/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Application-owned replacement point. The shell imports only this entry file.
// This contract fixture is temporary; Salesforce Payments becomes the default
// after the provider-neutral contract candidate is verified.
export {default} from './contract-test-provider'
