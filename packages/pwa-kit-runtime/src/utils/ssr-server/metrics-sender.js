/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * A class that used to handle asynchronous sending of CloudWatch metrics.
 *
 * Custom per-request CloudWatch metric emission has been removed to eliminate
 * the PutMetricData cost incurred on every request (W-22715301). This class is
 * retained as an inert no-op — it no longer creates a CloudWatch client or
 * calls putMetricData — so that code that still references it (including
 * `app.metrics` and any customer code) keeps working unchanged.
 *
 * Use MetricsSender.getSender() to get the singleton instance.
 *
 * @private
 */
export class MetricsSender {
    constructor() {
        // A queue of metrics waiting to be sent. Metric emission has been
        // removed (W-22715301), so nothing is ever pushed onto this queue; it
        // is kept so that `queueLength` continues to return a number.
        this._queue = []
    }

    /**
     * Return the number of metrics waiting to be sent. Always 0 now that
     * metric emission has been removed (W-22715301).
     * @returns {number}
     */
    get queueLength() {
        return this._queue.length
    }

    /**
     * Previously sent any queued metrics. Custom CloudWatch metric emission
     * has been removed to eliminate the PutMetricData cost incurred on every
     * request (W-22715301), so this is now a no-op that resolves immediately.
     *
     * Retained (with its original signature and never-rejecting contract) for
     * backwards compatibility with any code that calls it directly.
     *
     * @returns {Promise.<void>} an already-resolved Promise
     */
    flush() {
        // no-op: custom metric emission removed (W-22715301)
        return Promise.resolve()
    }

    /**
     * Previously added one or more custom metric values to the queue of those
     * waiting to be sent.
     *
     * Custom CloudWatch metric emission has been removed to eliminate the
     * PutMetricData cost incurred on every request (W-22715301), so this is
     * now a no-op: nothing is queued and nothing is ever sent.
     *
     * Retained (with its original signature) for backwards compatibility with
     * any code that calls it directly.
     *
     * @private
     * @param metrics {Array<Object>} - array of name, value objects (ignored)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    send(metrics) {
        // no-op: custom metric emission removed (W-22715301)
    }
}

/**
 * Get the singleton MetricsSender
 *
 * @returns {MetricsSender}
 */
MetricsSender.getSender = () => {
    if (!MetricsSender._instance) {
        MetricsSender._instance = new MetricsSender()
    }
    return MetricsSender._instance
}
