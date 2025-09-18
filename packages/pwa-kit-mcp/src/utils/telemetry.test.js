/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os'
// Mock @salesforce/telemetry to avoid importing Node "node:" specifiers in Jest
jest.mock('@salesforce/telemetry', () => {
    class TelemetryReporter {
        static async create() {
            return new TelemetryReporter()
        }
        start() {
            return undefined
        }
        stop() {
            return undefined
        }
        sendTelemetryEvent() {
            return undefined
        }
    }
    return {TelemetryReporter}
})

import {Telemetry} from './telemetry'

describe('Telemetry basics', () => {
    it('creates a session and allows sending custom events safely without reporter', () => {
        const t = new Telemetry({foo: 'bar'})
        expect(() => t.sendCustomEvent('TEST_EVENT', {x: 1})).not.toThrow()
        expect(typeof t.sessionId).toBe('string')
        expect(typeof t.cliId).toBe('string')
    })

    it('generates a cliid even if persistence is not possible', () => {
        // Simulate a home-less environment by mocking os.homedir
        const spy = jest.spyOn(os, 'homedir').mockReturnValue('')
        const t = new Telemetry()
        expect(typeof t.cliId).toBe('string')
        spy.mockRestore()
    })
})
