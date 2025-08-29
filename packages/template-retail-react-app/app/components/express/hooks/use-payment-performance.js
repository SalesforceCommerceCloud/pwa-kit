/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useRef, useCallback} from 'react'

/**
 * Hook for monitoring payment button performance metrics
 * @param {string} paymentMethod - The payment method name (e.g., 'applepay', 'googlepay')
 * @returns {Object} Performance monitoring functions and data
 */
export const usePaymentPerformance = (paymentMethod) => {
    const startTime = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now())
    const metrics = useRef({
        initializationStart: 0,
        checkoutCreationStart: 0,
        buttonCreationStart: 0,
        availabilityCheckStart: 0,
        mountingStart: 0,
        totalTime: 0
    })

    const markInitializationStart = useCallback(() => {
        // Clear previous performance marks and measures for this payment method
        try {
            if (typeof performance !== 'undefined' && performance.getEntriesByType) {
                const marks = performance.getEntriesByType('mark')
                marks.forEach(mark => {
                    if (mark.name.startsWith(paymentMethod)) {
                        performance.clearMarks(mark.name)
                    }
                })

                const measures = performance.getEntriesByType('measure')
                measures.forEach(measure => {
                    if (measure.name.startsWith(paymentMethod)) {
                        performance.clearMeasures(measure.name)
                    }
                })
            }
        } catch (error) {
            console.warn('Failed to clear previous performance data:', error)
        }
        
        // Reset the start time for each new initialization cycle
        startTime.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
        
        // Reset all metrics for the new cycle
        metrics.current = {
            initializationStart: startTime.current,
            checkoutCreationStart: 0,
            buttonCreationStart: 0,
            availabilityCheckStart: 0,
            mountingStart: 0,
            totalTime: 0
        }
        
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${paymentMethod}-initialization-start`)
        }
        
        console.log(`🔄 ${paymentMethod.toUpperCase()}: Timer reset, starting new initialization cycle`)
    }, [paymentMethod])

    const markCheckoutCreationStart = useCallback(() => {
        metrics.current.checkoutCreationStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${paymentMethod}-checkout-creation-start`)
        }
    }, [paymentMethod])

    const markButtonCreationStart = useCallback(() => {
        metrics.current.buttonCreationStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${paymentMethod}-button-creation-start`)
        }
    }, [paymentMethod])

    const markAvailabilityCheckStart = useCallback(() => {
        metrics.current.availabilityCheckStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${paymentMethod}-availability-check-start`)
        }
    }, [paymentMethod])

    const markMountingStart = useCallback(() => {
        metrics.current.mountingStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${paymentMethod}-mounting-start`)
        }
    }, [paymentMethod])

    const markPaymentReady = useCallback(() => {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
        metrics.current.totalTime = endTime - startTime.current
        
        // Mark the final performance metric
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${paymentMethod}-ready`)

            // Measure the total initialization time
            if (performance.measure) {
                performance.measure(
                    `${paymentMethod}-total-initialization`,
                    `${paymentMethod}-initialization-start`,
                    `${paymentMethod}-ready`
                )
            }
        }

        // Measure individual phases
        if (typeof performance !== 'undefined' && performance.measure && metrics.current.checkoutCreationStart > 0) {
            performance.measure(
                `${paymentMethod}-checkout-creation`,
                `${paymentMethod}-initialization-start`,
                `${paymentMethod}-checkout-creation-start`
            )
        }

        if (typeof performance !== 'undefined' && performance.measure && metrics.current.buttonCreationStart > 0) {
            performance.measure(
                `${paymentMethod}-button-creation`,
                `${paymentMethod}-checkout-creation-start`,
                `${paymentMethod}-button-creation-start`
            )
        }

        if (typeof performance !== 'undefined' && performance.measure && metrics.current.availabilityCheckStart > 0) {
            performance.measure(
                `${paymentMethod}-availability-check`,
                `${paymentMethod}-button-creation-start`,
                `${paymentMethod}-availability-check-start`
            )
        }

        if (typeof performance !== 'undefined' && performance.measure && metrics.current.mountingStart > 0) {
            performance.measure(
                `${paymentMethod}-mounting`,
                `${paymentMethod}-availability-check-start`,
                `${paymentMethod}-ready`
            )
        }

        // Log performance metrics
        const performanceEntries = typeof performance !== 'undefined' && performance.getEntriesByType ? 
            performance.getEntriesByType('measure') : []
        const paymentMeasures = performanceEntries.filter(entry => 
            entry.name.startsWith(paymentMethod)
        )

        console.group(`🚀 ${paymentMethod.toUpperCase()} Performance Metrics`)
        console.log(`Total initialization time: ${metrics.current.totalTime.toFixed(2)}ms`)
        
        paymentMeasures.forEach(measure => {
            console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`)
        })
        console.groupEnd()

        return metrics.current
    }, [paymentMethod])

    const markError = useCallback((error, phase) => {
        const endTime = performance.now()
        const duration = endTime - startTime.current
        
        console.error(`❌ ${paymentMethod.toUpperCase()} failed at ${phase}:`, error)
        console.log(`Time to failure: ${duration.toFixed(2)}ms`)

        // Mark error in performance timeline
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${paymentMethod}-error-${phase}`)
            
            // Measure time to error
            if (performance.measure) {
                performance.measure(
                    `${paymentMethod}-time-to-error`,
                    `${paymentMethod}-initialization-start`,
                    `${paymentMethod}-error-${phase}`
                )
            }
        }
    }, [paymentMethod])

    const resetPerformanceMonitoring = useCallback(() => {
        // Clear all performance data for this payment method
        try {
            if (typeof performance !== 'undefined' && performance.getEntriesByType) {
                const marks = performance.getEntriesByType('mark')
                marks.forEach(mark => {
                    if (mark.name.startsWith(paymentMethod)) {
                        performance.clearMarks(mark.name)
                    }
                })

                const measures = performance.getEntriesByType('measure')
                measures.forEach(measure => {
                    if (measure.name.startsWith(paymentMethod)) {
                        performance.clearMeasures(measure.name)
                    }
                })
            }
        } catch (error) {
            console.warn('Failed to clear performance data:', error)
        }
        
        // Reset metrics
        metrics.current = {
            initializationStart: 0,
            checkoutCreationStart: 0,
            buttonCreationStart: 0,
            availabilityCheckStart: 0,
            mountingStart: 0,
            totalTime: 0
        }
        
        console.log(`🔄 ${paymentMethod.toUpperCase()} performance monitoring reset`)
    }, [paymentMethod])

    return {
        markInitializationStart,
        markCheckoutCreationStart,
        markButtonCreationStart,
        markAvailabilityCheckStart,
        markMountingStart,
        markPaymentReady,
        markError,
        resetPerformanceMonitoring,
        metrics: metrics.current
    }
}
