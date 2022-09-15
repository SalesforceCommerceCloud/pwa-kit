/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {isRemote, localDevLog} from './utils'

const METRIC_RETRIES = 0

/**
 * A class that will handle asynchronous sending of CloudWatch
 * metrics.
 *
 * Use MetricsSender.getSender() to get the singleton instance.
 *
 * @private
 */
export class MetricsSender {
    constructor() {
        // CloudWatch client used to send metrics. For a local dev server,
        // this will remain falsy, since a local dev server doesn't actually
        // send metrics (unless SEND_CW_METRICS is defined for testing).
        this._CW = null

        // A queue of metrics waiting to be sent. Each is a single
        // name/value metric, and they accumulate on this queue
        // until batched up into a putMetricData call.
        this._queue = []

        // The default retry count
        this._retries = METRIC_RETRIES
    }

    /**
     * Return the number of metrics waiting to be sent
     * @returns {number}
     */
    get queueLength() {
        return this._queue.length
    }

    /**
     * Create a CloudWatch AWS SDK client, or return a falsy value
     * if this MetricsSender is not actually sending metrics.
     *
     * @private
     * @returns {CloudWatch|null}
     */
    _setup() {
        /* istanbul ignore next */
        if (!this._CW && (isRemote() || MetricsSender._override)) {
            // Load the AWS sdk. Although we do this on-demand, it's
            // likely that a webpacked project will include the whole
            // required module, so we require just the client that we need.
            const Cloudwatch = require('aws-sdk/clients/cloudwatch')
            this._CW = new Cloudwatch({
                apiVersion: '2010-08-01',
                // The AWS_REGION variable is defined by the Lambda
                // environment.
                region: process.env.AWS_REGION || 'us-east-1'
            })
        }
        return this._CW
    }

    /**
     * Call putMetricData as needed, including retrying.
     *
     * @private
     * @param {CloudWatch} cw - Cloudwatch client
     * @param {Array} metrics - Array of metrics to send
     * @returns {Promise.<*>} resolved when the metrics are sent
     * (or when they can't be sent).
     */
    _putMetricData(cw, metrics) {
        /* istanbul ignore next */
        if (!cw) {
            return Promise.resolve()
        }

        return new Promise((resolve) => {
            // The parameters for putMetricData
            const params = {
                MetricData: metrics,
                Namespace: 'ssr'
            }

            // Initialize the retry count
            let retries = this._retries

            // Initialize the retry delay
            // This delay is long enough to reduce the sending
            // rate, but not so much that it delays completion
            // of a response too much.
            let retryDelay = 50 // mS

            // This callback is called when the putMetricData operation
            // is complete, or if an error occurs.
            const callback = (err) => {
                let retry = false

                if (err) {
                    if (err.code === 'Throttling') {
                        // We exceeded the CloudWatch metric sending
                        // rate. We may need to retry.
                        retry = --retries > 0
                        const msg = retry ? `retrying after ${retryDelay} mS` : 'not retrying'
                        console.warn(
                            `Metrics: ${err} when sending metric data (length ${metrics.length}): ${msg}`
                        )
                    } else {
                        // Some other error
                        console.warn(`Metrics: error sending data: ${err}`)
                    }
                }

                if (retry) {
                    // We need to delay before we actually retry
                    setTimeout(() => cw.putMetricData(params, callback), retryDelay)
                    // Increase the delay for any future retry
                    retryDelay += 25 // mS
                } else {
                    // Sending is done.
                    localDevLog(
                        `Metrics: ${err ? 'discarded' : 'completed'} sending ${
                            metrics.length
                        } metric(s)`
                    )
                    resolve()
                }
            }

            // Send the metrics
            cw.putMetricData(params, callback)
        })
    }

    /**
     * Send any queued metrics. Returns a Promise that resolves when
     * all sending is done.
     * The Promise will never reject.
     */
    flush() {
        // Pending Promises for _putMetricData calls
        const promises = []

        // Get a CloudWatch client (this will be falsy if we're not
        // really sending)
        const cw = this._setup()
        while (this._queue.length) {
            // Grab a batch of metrics from the queue - the maximum batch
            // size is 20.
            const queue = this._queue.slice(0, 20)
            this._queue = this._queue.slice(20)

            // Send the metrics
            promises.push(this._putMetricData(cw, queue))
        }

        return Promise.all(promises).catch(
            /* istanbul ignore next */
            (err) => console.warn(`Metrics: error during flush: ${err}`)
        )
    }

    /**
     * Add one or more custom metric values to the queue of those waiting
     * to be sent. This function supports simple name-and-value metrics.
     * It doesn't support more complex CloudWatch types.
     *
     * A metric is an object with at least 'name' (string) and 'value'
     * (number, defaults to 0). It may also optionally include 'timestamp'
     * (defaults to the time of the call to send()), and 'unit', which
     * must be one of Seconds, Microseconds, Milliseconds, Bytes, Kilobytes,
     * Megabytes, Gigabytes, Terabytes, Bits, Kilobits, Megabits, Gigabits,
     * Terabits, Percent, Count, Bytes/Second, Kilobytes/Second,
     * Megabytes/Second, Gigabytes/Second, Terabytes/Second,
     * Bits/Second, Kilobits/Second, Megabits/Second, Gigabits/Second,
     * Terabits/Second, Count/Second or None (defaults to 'Count').
     * There may also be a 'dimensions'
     * object, which has dimension names as keys and dimension
     * values as values.
     *
     * If called in the local development server, the metric information
     * will be logged, but the code will not actually emit anything. This
     * can be overridden by defining the SEND_CW_METRICS environment
     * variable, for testing.
     *
     * The metrics are added to an internal queue so that they can be
     * batched up to send more efficiently. They are only sent when
     * flush() is called.
     *
     * @private
     * @param metrics {Array<Object>} - array of name, value objects
     */
    send(metrics) {
        const now = new Date()
        metrics.forEach((metric) => {
            const metricData = {
                MetricName: metric.name,
                Value: metric.value || 0,
                // This value must be a string
                Timestamp: (metric.timestamp instanceof Date
                    ? metric.timestamp
                    : now
                ).toISOString(),
                Unit: metric.unit || 'Count'
            }

            if (metric.dimensions) {
                const dimensions = (metricData.Dimensions = [])
                Object.entries(metric.dimensions).forEach(([key, value]) => {
                    if (value) {
                        dimensions.push({
                            Name: key,
                            Value: value
                        })
                    }
                })
            }

            this._queue.push(metricData)
        })
    }
}

// Allow the presence of an environment variable to
// enable sending of CloudWatch metrics (for local
// integration testing)
MetricsSender._override = !!process.env.SEND_CW_METRICS

/**
 * Get the singleton MetricsSender
 *
 * @private
 * @returns {MetricsSender}
 */
MetricsSender.getSender = () => {
    if (!MetricsSender._instance) {
        MetricsSender._instance = new MetricsSender()
    }
    return MetricsSender._instance
}
