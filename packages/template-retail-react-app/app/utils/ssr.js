/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Check if the code is running on the client side
 * @returns {boolean} True if running on client, false if on server
 */
export const onClient = typeof window !== 'undefined'

/**
 * Check if the code is running on the server side
 * @returns {boolean} True if running on server, false if on client
 */
export const onServer = typeof window === 'undefined' 