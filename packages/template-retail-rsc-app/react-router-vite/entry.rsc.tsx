import {
    createTemporaryReferenceSet,
    decodeAction,
    decodeReply,
    loadServerAction,
    renderToReadableStream
} from '@vitejs/plugin-rsc/rsc'
import {unstable_matchRSCServerRequest as matchRSCServerRequest} from 'react-router'
import {RequestContext} from '../src/app/utils/requestContext'

import routes from 'virtual:react-router-routes'

export async function fetchServer(request: Request): Promise<Response> {
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
                        {match.payload}
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
