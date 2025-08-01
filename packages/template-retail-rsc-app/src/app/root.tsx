import {type PropsWithChildren} from 'react'
import {Outlet, ScrollRestoration} from 'react-router'
import {ServerHmr} from '../../react-router-vite/server-hmr'
import CommerceProvider from '@/app/providers/commerce'
import CommerceServerProvider from '@/app/providers/commerce.server'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import {getCommerceApiToken} from '@/app/utils/api/commerce-api'
import {RequestContext} from '@/app/utils/requestContext'
import {getServerContext} from '@/app/utils/serverContext'
import DumpError from './routes/error'
import Loading from './routes/loading'
import './routes/root.css'

export function Layout({children}: PropsWithChildren) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <title>NextGen PWA Kit Store</title>
            </head>
            <body className="antialiased flex flex-col min-h-screen">
                {/* Find a way to memoize the dehydrated state */}
                {/*<HydratedQueryProvider state={dehydrate(getQueryClient())}>*/}
                {children}
                {/*</HydratedQueryProvider>*/}
                {import.meta.env.DEV ? <ServerHmr /> : null}
            </body>
        </html>
    )
}

export function ErrorBoundary() {
    return <DumpError />
}

export default async function App() {
    // Get the request object from the server context
    const request = getServerContext(RequestContext)

    if (!request) {
        throw new Error('Request context not available')
    }

    // Load session data ONCE and provide it to all server components via context
    const [session, commitSession, status] = await getCommerceApiToken(request)
    const sessionData = Object.freeze(session.data)

    return (
        <CommerceServerProvider context={{session: sessionData}}>
            <CommerceProvider context={{session: sessionData}}>
                <Loading />
                <ScrollRestoration />
                <Header />
                <main className="flex-grow pt-8">
                    <Outlet />
                </main>
                <Footer />
            </CommerceProvider>
        </CommerceServerProvider>
    )
}
