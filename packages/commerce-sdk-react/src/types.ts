export interface CommonHookResponse {
    error: Error | undefined
    isLoading: boolean
}

// These are the common params for all query hooks
// it allows user to override configs for specific query
export interface QueryParams {
    siteId?: string
    locale?: string
    currency?: string
    organizationId?: string
    shortCode?: string
}

export interface QueryResponse<T> extends CommonHookResponse {
    data: T
}

export interface ActionResponse<T> extends CommonHookResponse {
    execute: T
}

export type DependencyList = readonly any[]
