/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * A logger interface for logging messages at various levels.
 */
export interface Logger {
    /**
     * Log a debug message.
     * @param message - The message to log.
     * @param optionalParams - Optional parameters to log with the message.
     */
    debug(message: string, optionalParams?: Record<string, unknown>): void

    /**
     * Log an informational message.
     * @param message - The message to log.
     * @param optionalParams - Optional parameters to log with the message.
     */
    info(message: string, optionalParams?: Record<string, unknown>): void

    /**
     * Log a warning message.
     * @param message - The message to log.
     * @param optionalParams - Optional parameters to log with the message.
     */
    warn(message: string, optionalParams?: Record<string, unknown>): void

    /**
     * Log an error message.
     * @param message - The message to log.
     * @param optionalParams - Optional parameters to log with the message.
     */
    error(message: string, optionalParams?: Record<string, unknown>): void
}
