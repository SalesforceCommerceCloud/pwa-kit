import {
    createTemporaryReferenceSet,
    decodeAction,
    decodeReply,
    loadServerAction,
    renderToReadableStream
} from '@vitejs/plugin-rsc/rsc'
import {unstable_matchRSCServerRequest as matchRSCServerRequest} from 'react-router'
import {RequestContext} from '../src/app/utils/requestContext'
import {CommerceServerContext} from '../src/app/providers/commerce.server'
import {getCommerceApiToken} from '../src/app/utils/api/commerce-api'

import routes from 'virtual:react-router-routes'

export async function fetchServer(request: Request): Promise<Response> {
    // Load session once at the RSC server level
    const [session] = await getCommerceApiToken(request)
    const sessionData = Object.freeze(session.data)

    return await matchRSCServerRequest({
        createTemporaryReferenceSet,
        decodeReply,
        decodeAction,
        loadServerAction,
        request,
        routes,
        generateResponse(match, options) {
            return new Response(
                renderToReadableStream(
                    <RequestContext.Provider value={request}>
                        <CommerceServerContext.Provider value={{session: sessionData}}>
                            {match.payload}
                        </CommerceServerContext.Provider>
                    </RequestContext.Provider>,
                    options
                ),
                {
                    status: match.statusCode,
                    headers: match.headers
                }
            )
        }
    })
}

if (import.meta.hot) {
    import.meta.hot.accept()
}
