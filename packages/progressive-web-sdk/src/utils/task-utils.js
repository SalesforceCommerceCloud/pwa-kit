/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/task-utils
 */
/*
 This file contains utility functions for "deferred" task execution. Deferred
 tasks don't execute immediately, they are added to a queue managed by an
 idle callback (or setTimeout), which executes one task at a time when the
 main thread is free.

 This module is intended for use by the PerformanceManager.
 */
import Logger from './logger'
import {noop} from './utils'

// Polyfill performance-recording functions
/* istanbul ignore next */
console.time = console.time || noop
/* istanbul ignore next */
console.timeEnd = console.timeEnd || noop
/* istanbul ignore next */
console.timeStamp = console.timeStamp || noop

/**
 * Maximum execution time for a deferred function. If a function takes
 * longer than this limit, a console warning is issued.
 *
 * @private
 * @type {number}
 */
const TASK_LIMIT_MS = 50

/**
 * Where the browser supports requestIdleCallback, we use that. Where it
 * doesn't, we use setTimeout.
 *
 * @private
 * @param fn - the function to be executed
 */
const callWhenIdle = (fn) => {
    /* istanbul ignore next */
    if (window.requestIdleCallback) {
        window.requestIdleCallback(fn, {timeout: 100})
    } else {
        setTimeout(fn, 0)
    }
}

/**
 * For DEBUG purposes, a unique index for each deferred task.
 *
 * @private
 * @type {number}
 */
let deferIndex = 0

/**
 * The Array of deferred functions waiting for execution. New functions
 * are pushed onto the end of the array, and functions to be executed are
 * shifted off the front of the array.
 *
 * @private
 * @type {Array}
 */
const deferredFunctions = []

/**
 * The handle to the next idle or timeout call of the deferHandler. When
 * there are no deferred functions waiting, this will be null.
 * @private
 */
let idleHandle = null

/**
 * Logger for this module. This is considered part of the PerformanceManager.
 * @private
 */
export const logger = new Logger('[PerformanceManager]')

/**
 * For debugging - will log (using Logger) and also emit a timeStamp
 * in browsers that support it.
 * @private
 * @param msg - message to be logged
 */
const logAndTimestamp = (msg) => {
    logger.log(msg)
    Logger.isDebug() && console.timeStamp(msg)
}

/**
 * Const for event that is fired when deferred processing starts/stops.
 * The event has a 'processing' boolean that is true when processing starts
 * and false when processing is done (there are no deferred tasks to
 * process).
 * @private
 */
export const PWADeferredProcessingStateEvent = 'pwaDeferredProcessingEvent'

/**
 * The last processing state (true/false) that was sent in a
 * PWADeferredProcessingStateEvent.
 * @private
 */
let lastProcessingState

/**
 * If the processing state changes, send a PWADeferredProcessingStateEvent.
 * @private
 */
const updateProcessingState = (state) => {
    const processingState = !!state
    if (lastProcessingState !== processingState) {
        const event = new Event(PWADeferredProcessingStateEvent)
        event.processing = lastProcessingState = processingState
        logger.log(`Sending ${PWADeferredProcessingStateEvent} with processing=${event.processing}`)
        dispatchEvent(event)
    }
}

/**
 * Idle/setTimeout handler that executes deferred functions asynchronously,
 * one at a time, within an idle callback.
 * @private
 */
const deferHandler = () => {
    const deferred = deferredFunctions.shift()
    if (deferred) {
        const debug = Logger.isDebug()

        updateProcessingState(true)

        const func = deferred.fn
        const name = func.displayName || func.name || '(anonymous)'
        let message

        /* istanbul ignore next */
        if (debug) {
            message = `Deferred function "${name}" (${deferred.index})`
            logger.log(message)
            console.time(message)
        }

        const now = Date.now()
        try {
            func()
        } catch (e) {
            console.error(`Error thrown in ${message}: ${e}`)
        }

        if (debug) {
            console.timeEnd(message)
        }

        const elapsed = Date.now() - now
        const excess = elapsed > TASK_LIMIT_MS

        // If execution takes longer than the limit, we will always warn.
        // Otherwise, we only log in debug mode.

        /* istanbul ignore next */
        if (excess || debug) {
            message = `${message} took ${elapsed} mS`
            if (excess) {
                console.warn(message)
            } else {
                logger.log(message)
            }
        }

        // Schedule execution of the next task
        idleHandle = callWhenIdle(deferHandler)
    } else {
        logAndTimestamp('All deferred functions done')
        updateProcessingState(false)
        idleHandle = null
    }
}

/**
 * Defer the execution of a function
 * @function
 * @param fn - the function to be deferred
 */
export const defer = (fn) => {
    deferredFunctions.push({
        index: deferIndex++,
        fn
    })
    /* istanbul ignore else */
    if (!idleHandle) {
        logAndTimestamp('Starting deferred function processing')
        idleHandle = callWhenIdle(deferHandler)
    }
}
