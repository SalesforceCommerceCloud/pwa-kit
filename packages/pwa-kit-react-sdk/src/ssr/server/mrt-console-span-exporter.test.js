/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */

jest.mock('../../utils/opentelemetry-config', () => ({
    getOTELConfig: jest.fn()
}))

import {MrtConsoleSpanExporter} from './mrt-console-span-exporter'
import {getOTELConfig} from '../../utils/opentelemetry-config'

const makeSpan = () => ({
    spanContext: () => ({traceId: 'trace-abc', spanId: 'span-123'}),
    parentSpanContext: {spanId: 'parent-999'},
    name: 'ssr.render',
    kind: 0,
    startTime: [1718000000, 0],
    endTime: [1718000000, 5000000],
    duration: [0, 5000000],
    // service.name lives on the Resource (as the DT provider sets it), NOT on
    // span attributes — the exporter must merge it into the emitted attributes.
    resource: {attributes: {'service.name': 'pwa-kit-react-sdk'}},
    attributes: {'http.request.method': 'GET'},
    status: {code: 0},
    events: [],
    links: []
})

describe('MrtConsoleSpanExporter', () => {
    let infoSpy
    beforeEach(() => {
        infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    })
    afterEach(() => {
        infoSpy.mockRestore()
    })

    test('prints one JSON line per span with the MRT-expected fields', () => {
        getOTELConfig.mockReturnValue({enabled: true})
        const exporter = new MrtConsoleSpanExporter()
        const cb = jest.fn()

        exporter.export([makeSpan()], cb)

        expect(infoSpy).toHaveBeenCalledTimes(1)
        const payload = JSON.parse(infoSpy.mock.calls[0][0])
        expect(payload).toMatchObject({
            traceId: 'trace-abc',
            parentId: 'parent-999',
            name: 'ssr.render',
            id: 'span-123',
            forwardTrace: true
        })
        expect(cb).toHaveBeenCalledWith({code: 0})
    })

    test('resource service.name merged into emitted attributes', () => {
        getOTELConfig.mockReturnValue({enabled: true})
        const exporter = new MrtConsoleSpanExporter()
        const cb = jest.fn()

        exporter.export([makeSpan()], cb)

        const payload = JSON.parse(infoSpy.mock.calls[0][0])
        expect(payload.attributes).toMatchObject({
            'service.name': 'pwa-kit-react-sdk',
            'http.request.method': 'GET'
        })
    })

    test('never throws on a malformed span', () => {
        getOTELConfig.mockReturnValue({enabled: true})
        const exporter = new MrtConsoleSpanExporter()
        const cb = jest.fn()
        expect(() => exporter.export([{}], cb)).not.toThrow()
        expect(cb).toHaveBeenCalledWith({code: 0})
    })

    test('forwardTrace delegates to getOTELConfig().enabled', () => {
        getOTELConfig.mockReturnValue({enabled: false})
        const exporter = new MrtConsoleSpanExporter()
        const cb = jest.fn()

        exporter.export([makeSpan()], cb)

        const payload = JSON.parse(infoSpy.mock.calls[0][0])
        expect(payload.forwardTrace).toBe(false)

        infoSpy.mockClear()

        getOTELConfig.mockReturnValue({enabled: true})
        exporter.export([makeSpan()], cb)

        const payload2 = JSON.parse(infoSpy.mock.calls[0][0])
        expect(payload2.forwardTrace).toBe(true)
    })
})
