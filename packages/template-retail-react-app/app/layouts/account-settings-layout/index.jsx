
import React from 'react'
import { getLayout as getSiteLayout } from '../site-layout'

const AccountSettingsLayout = ({ children }) => {
    return(
        <div>
            AccountSettingsLayout
            <div>{children}</div>
        </div>
    )
}

export const getLayout = page =>{
    return getSiteLayout(<AccountSettingsLayout>{page}</AccountSettingsLayout>)
}

export default AccountSettingsLayout