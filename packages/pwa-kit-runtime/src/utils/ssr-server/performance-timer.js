/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PerformanceObserver, performance} from 'perf_hooks'

/**
 * Class that wraps the Node Performance API to guard against
 * changes (it's at Stability 1 in node 8.10) and to make
 * the usage simpler.
 *
 * To use: create an instance of this class, and then call start() and
 * end(), passing the name of the duration being measured. To get all
 * the measured values, use summary().
 *
 * To time a function, use time(), passing a duration name
 * (useful when the same function is called multiple times and you want
 * to measure them separately) and function arguments.
 *
 * @private
 */
export class PerformanceTimer {
    /**
     * Construct a new PerformanceTimer, with the given name
     * as a 'namespace' within which all durations can be
     * measured. When the object is deleted, it clears all
     * entries under this namespace, so multiple
     * PerformanceTimer instances can be used at once.
     * @private
     * @param name
     */
    constructor(name) {
        this._namespace = `${name}-`
        // Length of the namespace prefix (with the '-' postfix)
        const nslen = this._namespace.length

        this._names = {}
        const results = (this._results = [])
        this._observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                const en = entry.name
                // Only include PerformanceEntry objects in
                // the namespace of this PerformanceTimer
                if (en.startsWith(this._namespace)) {
                    results.push({
                        name: en.slice(nslen),
                        duration: entry.duration
                    })
                }
            })
        }, false)
        this._observer.observe({entryTypes: ['measure']})
        this._nextOperationId = 1
    }

    /**
     * Returns an operation id that's unique to this PerformanceTimer,
     * so that timing code can use it to distinguish repeat timings.
     * Returns a different value on each access.
     * @return {number}
     */
    get operationId() {
        return this._nextOperationId++
    }

    /**
     * Given a name, return a namespaced version of it,
     * with the optional extension, and include teh result
     * in the _names object.
     * @private
     */
    _getMarkName(name, extension) {
        const ext = extension ? `-${extension}` : ''
        const mark = `${this._namespace}${name}${ext}`
        this._names[mark] = true
        return mark
    }

    /**
     * Mark the start of the duration with the given name
     * @private
     * @param name {String} duration name
     */
    start(name) {
        performance.mark(this._getMarkName(name, 'start'))
    }

    /**
     * Mark the end of the duration with the given name
     * @private
     * @param name {String} duration name
     */
    end(name) {
        const startName = this._getMarkName(name, 'start')
        const endName = this._getMarkName(name, 'end')
        performance.mark(endName)
        performance.measure(this._getMarkName(name), startName, endName)
        performance.clearMarks(startName)
        performance.clearMarks(endName)
    }

    /**
     * Clear the duration with the given name
     * @private
     * @param name {String} duration name
     */
    clear(name) {
        performance.clearMarks(this._getMarkName(name, 'start'))
        performance.clearMarks(this._getMarkName(name, 'end'))
        performance.clearMarks(this._getMarkName(name))
    }

    /**
     * Finish with this PerformanceObserver
     * @private
     */
    finish() {
        Object.keys(this._names).forEach((mark) => performance.clearMarks(mark))
        this._names = {}
        this._observer.disconnect()
        this._observer = null
    }

    /**
     * Measure the duration of the given function,
     * which is called with any remaining arguments
     * after name and fn.
     *
     * If the function throws an error, no duration
     * is recorded.
     *
     * @private
     * @param name {String} duration name
     * @param fn {function} function to call
     * @param args {Array} any arguments to the function
     */
    time(name, fn, ...args) {
        this.start(name)
        try {
            const result = fn(...args)
            this.end(name)
            return result
        } catch (err) {
            this.clear(name)
            throw err
        }
    }

    /**
     * Get an object (that can be JSON-serialized) for all
     * measured times.
     * @private
     */
    get summary() {
        return this._results
    }

    /**
     * Get access to the performance API used by this timer
     * @private
     * @return {Performance}
     */
    get performance() {
        /* istanbul ignore next */
        return performance
    }
}
