// /components/site-layout/index.jsx
import React from 'react'
import {Link} from "@chakra-ui/react";
const SiteLayout = ({ children }) => {
    console.log('SiteLayout children:', children)
    return (<div>SiteLayout{/* ... */}<Link href="/account-settings/basic-information">
        <a className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg px-6 py-4 leading-tight">
            View account settings
        </a>
    </Link><div className="mt-6 sm:mt-0 sm:py-12">{children}</div></div>)}

export const getLayout = page =>{
    console.log('SiteLayout page:', page)
    return (<SiteLayout>{page}</SiteLayout>)}

export default SiteLayout