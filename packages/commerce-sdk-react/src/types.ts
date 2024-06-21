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
     * Logs a debug message.
     * @param message - The debug message.
     * @param args - Optional additional properties to include in the log.
     */
    debug(message: string, args?: Record<string, unknown>): void

    /**
     * Logs an informational message.
     * @param message - The info message.
     * @param args - Optional additional properties to include in the log.
     */
    info(message: string, args?: Record<string, unknown>): void

    /**
     * Logs a generic log message.
     * @param message - The log message.
     * @param args - Optional additional properties to include in the log.
     */
    log(message: string, args?: Record<string, unknown>): void

    /**
     * Logs a warning message.
     * @param message - The warning message.
     * @param args - Optional additional properties to include in the log.
     */
    warn(message: string, args?: Record<string, unknown>): void

    /**
     * Logs an error message.
     * @param message - The error message.
     * @param args - Optional additional properties to include in the log.
     */
    error(message: string, args?: Record<string, unknown>): void
}
