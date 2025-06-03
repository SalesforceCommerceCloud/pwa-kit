/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node'
import {SimpleSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {B3Propagator} from '@opentelemetry/propagator-b3'
import {Resource} from '@opentelemetry/resources'
import {SemanticResourceAttributes} from '@opentelemetry/semantic-conventions'
import {propagation} from '@opentelemetry/api'

const SERVICE_NAME = 'pwa-kit-react-sdk'

let provider = null

export const initializeServerTracing = () => {
    try {
        // Initialize the tracer provider
        provider = new NodeTracerProvider({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME
            })
        })

        // Add B3 propagator
        provider.addSpanProcessor(new SimpleSpanProcessor())
        propagation.setGlobalPropagator(new B3Propagator())
        provider.register()

        return provider
    } catch (error) {
        // Log errors from OpenTelemetry initialization
        console.warn('Failed to initialize OpenTelemetry provider:', error.message)
        return null
    }
}

export const shutdownServerTracing = async () => {
    if (provider) {
        try {
            await provider.shutdown()
        } catch (error) {
            console.warn('Failed to shutdown OpenTelemetry provider:', error.message)
        }
    }
}