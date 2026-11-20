/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Application-owned replacement point. The shell imports only this entry file.
// The neutral default renders nothing and reports unavailable until the application
// explicitly selects a supported payment provider.
export {default} from './providers/unavailable-express-payment-provider'
