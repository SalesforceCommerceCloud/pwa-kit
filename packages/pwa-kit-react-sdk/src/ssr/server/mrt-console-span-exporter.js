/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * MRT-compatible console span exporter.
 *
 * MRT scrapes stdout and forwards spans to the trace backend (Jaeger); this
 * exporter's only job is to print the JSON shape MRT expects. No OTLP endpoint
 * is involved.
 *
 * @env OTEL_TRACING_ENABLED — resolved via getOTELConfig().enabled
 */
import {ConsoleSpanExporter} from '@opentelemetry/sdk-trace-base'
import {ExportResultCode, hrTimeToTimeStamp} from '@opentelemetry/core'
import {getOTELConfig} from '../../utils/opentelemetry-config'

export class MrtConsoleSpanExporter extends ConsoleSpanExporter {
    export(spans, resultCallback) {
        for (const span of spans) {
            try {
                const ctx = span.spanContext()
                const spanData = {
                    traceId: ctx.traceId,
                    parentId: span.parentSpanId,
                    name: span.name,
                    id: ctx.spanId,
                    kind: span.kind,
                    timestamp: hrTimeToTimeStamp(span.startTime),
                    duration: span.duration,
                    // Merge resource attributes (e.g. service.name, set on the
                    // provider Resource) into span attributes. MRT/Jaeger keys on
                    // service.name in attributes, matching server_timing's logSpanData.
                    attributes: {...span.resource?.attributes, ...span.attributes},
                    status: span.status,
                    events: span.events,
                    links: span.links,
                    start_time: span.startTime,
                    end_time: span.endTime,
                    forwardTrace: getOTELConfig().enabled
                }
                // eslint-disable-next-line no-console -- intentional: MRT collects stdout as the telemetry transport
                console.info(JSON.stringify(spanData))
            } catch {
                // Skip malformed spans — never let a serialization failure propagate
            }
        }
        resultCallback({code: ExportResultCode.SUCCESS})
    }
}
