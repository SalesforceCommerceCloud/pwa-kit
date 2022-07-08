interface CommonHookResponse {
    error: Error | undefined
    isLoading: boolean
}

// These are the common params for all query hooks
// it allows user to override configs for specific query
interface QueryParams {
    siteId?: string
    locale?: string
    currency?: string
    organizationId?: string
    shortCode?: string
}

interface QueryResponse<data> extends CommonHookResponse {
    data: data
}

interface ActionResponse<execute> extends CommonHookResponse {
    execute: execute
}

export type {QueryParams, QueryResponse, ActionResponse}
