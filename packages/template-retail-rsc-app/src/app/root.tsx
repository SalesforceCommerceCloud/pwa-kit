import {type PropsWithChildren} from 'react'
import {
    data,
    type LoaderFunctionArgs,
    Outlet,
    ScrollRestoration,
    type UNSAFE_DataWithResponseInit
} from 'react-router'
import {ServerHmr} from '../../react-router-vite/server-hmr'
import CommerceProvider from '@/app/providers/commerce'
import Header from '@/app/components/header'
import Footer from '@/app/components/footer'
import {getCommerceApiToken} from '@/app/utils/api/commerce-api'
import DumpError from './routes/error'
import Loading from './routes/loading'
import './routes/root.css'

type LoaderProps = {
    session: Record<string, any>
}

export async function loader({
    request
}: LoaderFunctionArgs): Promise<UNSAFE_DataWithResponseInit<LoaderProps>> {
    const [session, commitSession, status] = await getCommerceApiToken(request)
    return data(
        {
            session: Object.freeze(session.data)
        },
        {
            ...(status === 'new' || status === 'refreshed'
                ? {
                      headers: {
                          'Set-Cookie': await commitSession(session)
                      }
                  }
                : {})
        }
    )
}

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

export default function App({loaderData: {session}}: {loaderData: LoaderProps}) {
    return (
        <CommerceProvider context={{session}}>
            <Loading />
            <ScrollRestoration/>
            <Header />
            <main className="flex-grow pt-8">
                <Outlet />
            </main>
            <Footer />
        </CommerceProvider>
    )
}
