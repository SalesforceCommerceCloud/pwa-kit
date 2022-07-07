interface CommonHookResponse {
    error: Error | undefined
    isLoading: boolean
}

interface QueryResponse<data> extends CommonHookResponse {
    data: data
}

interface ActionResponse<execute> extends CommonHookResponse {
    execute: execute
}

export type {QueryResponse, ActionResponse}
