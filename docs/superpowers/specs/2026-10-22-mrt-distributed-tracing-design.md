# MRT distributed-tracing flag compatibility

## Goal

Enable PWA Kit OpenTelemetry and distributed tracing when either the existing
`OTEL_TRACING_ENABLED` flag or Managed Runtime's
`MRT_DISTRIBUTED_TRACING_ENABLED` flag is the exact string `"true"`.

## Design

`getOTELConfig()` remains the single source of truth. Its `enabled` field will
be true when either environment variable is `"true"`; all other values leave
tracing disabled. The existing `OTEL_TRACING_ENABLED` behavior remains
unchanged for local development and current deployments.

All existing callers already consume `getOTELConfig().enabled`. This includes
the distributed-tracing SSR render path, the MRT console span exporter's
`forwardTrace` value, and `serverTiming`'s OpenTelemetry path. Broadening that
one predicate therefore enables the MRT flag consistently without creating a
second gate or altering the `serverTiming` control flow.

## Validation

Add configuration tests that prove each flag independently enables tracing,
neither flag enables it when unset, and unsupported values remain disabled.
Run the focused SDK configuration tests and the affected distributed-tracing
and server-timing tests. Update the distributed-tracing documentation and
inline environment-variable references, then add a patch changeset for the
SDK.

## Scope boundaries

This change does not remove `OTEL_TRACING_ENABLED`, change sampling behavior,
or modify MRT's trace-ingestion/realm configuration. It is limited to PWA Kit
SDK flag compatibility and documentation.
