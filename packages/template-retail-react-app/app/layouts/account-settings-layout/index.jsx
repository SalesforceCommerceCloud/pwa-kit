// /components/AccountSettingsLayout.js
import React from 'react'
import SiteLayout, { getLayout as getSiteLayout } from '../site-layout'

const AccountSettingsLayout = ({ children }) => {
    console.log('AccountSettingsLayout children:', children)
    return(<div>AccountSettingsLayout <div>{children}</div></div>)}

export const getLayout = page =>{
    console.log('AccountSettingsLayout page:', page)
    return (getSiteLayout(<AccountSettingsLayout>{page}</AccountSettingsLayout>))}
export default AccountSettingsLayout