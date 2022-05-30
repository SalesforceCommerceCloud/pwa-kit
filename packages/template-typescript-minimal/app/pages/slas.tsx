import React from 'react'
import {useContext} from 'slas-react-sdk'

const SlasDemo = (props) => {
    const slasConfig = useContext()
    const {organizationId, siteId, clientId} = slasConfig
    return (
        <div>
            <h2>Organization ID: {organizationId}</h2>
            <h2>Site ID: {siteId}</h2>
            <h2>Client ID: {clientId}</h2>
        </div>
    )
}

export default SlasDemo
