import {type PropsWithChildren} from 'react'
import {Outlet, ScrollRestoration} from 'react-router'
import {ServerHmr} from '../../react-router-vite/server-hmr'
import CommerceProvider from '@/app/providers/commerce'
import {CommerceServerContext} from '@/app/providers/commerce.server'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import {getServerContext} from '@/app/utils/serverContext'
import DumpError from './routes/error'
import Loading from './routes/loading'
import './routes/root.css'

export function Layout({children}: PropsWithChildren) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <title>NextGen PWA Kit Store</title>
                {/* Preload hero image to start download immediately */}
                <link rel="preload" href="/images/hero.png" as="image" fetchPriority="high" />
            </head>
            <body className="antialiased flex flex-col min-h-screen">
                {children}
                {import.meta.env.DEV ? <ServerHmr /> : null}
            </body>
        </html>
    )
}

export function ErrorBoundary() {
    return <DumpError />
}

// Simple non-blocking root component
// Session context is now provided at the RSC server level
export default function App() {
    // Get session from server context (loaded at RSC server level)
    const context = getServerContext(CommerceServerContext)
    if (!context?.session) {
        throw new Error('Unexpected State: No commerce context provided.')
    }

    return (
        <CommerceProvider context={{session: context.session}}>
            <Loading />
            <ScrollRestoration />
            <Header />
            <main className="flex-grow pt-8">
                <Outlet />
            </main>
            <Footer />
        </CommerceProvider>
    )
}
