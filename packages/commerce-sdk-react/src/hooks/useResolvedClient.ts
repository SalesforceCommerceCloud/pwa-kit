import { ApiClients } from "./types"
import useCommerceApi from "./useCommerceApi"

export function useResolvedClient<T extends keyof ApiClients>(
    clientName: T
): NonNullable<ApiClients[T]> {
    const api = useCommerceApi()
    const client = api[clientName]
    
    if (!client) {
        throw new Error(
            `Missing required client: ${String(clientName)}. ` +
            `Please initialize ${String(clientName)} class and provide it in CommerceApiProvider's apiClients prop.`
        )
    }
    return client
}
