import {
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
    setServerCallback
} from '@vitejs/plugin-rsc/browser'
import {StrictMode, startTransition} from 'react'
import {hydrateRoot} from 'react-dom/client'
import {
    unstable_RSCHydratedRouter as RSCHydratedRouter,
    type unstable_RSCPayload as RSCPayload,
    unstable_createCallServer as createCallServer,
    unstable_getRSCStream as getRSCStream
} from 'react-router'

setServerCallback(
    createCallServer({
        createFromReadableStream,
        encodeReply,
        createTemporaryReferenceSet
    })
)

createFromReadableStream<RSCPayload>(getRSCStream()).then((payload: RSCPayload) => {
    startTransition(() => {
        hydrateRoot(
            document,
            <StrictMode>
                <RSCHydratedRouter
                    createFromReadableStream={createFromReadableStream}
                    payload={payload}
                />
            </StrictMode>
        )
    })
})
