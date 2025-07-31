'use client'

import {useRouteError} from 'react-router'

export default function DumpError() {
    const error = useRouteError()
    const message =
        error instanceof Error ? (
            <div>
                <pre>
                    {JSON.stringify(
                        {
                            ...error,
                            name: error.name,
                            message: error.message
                        },
                        null,
                        2
                    )}
                </pre>
                {error.stack && <pre>{error.stack}</pre>}
            </div>
        ) : (
            <div>Unknown Error</div>
        )
    return (
        <>
            <h1>Oooops</h1>
            <pre>{message}</pre>
        </>
    )
}
