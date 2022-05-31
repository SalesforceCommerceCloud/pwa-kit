import React from 'react'
import {useContext} from 'slas-react-sdk'

const SlasDemo = (props) => {
    const slasConfig = useContext()
    const {config, shopper} = slasConfig
    const {organizationId, siteId, clientId, shortCode} = config
    console.log(shopper)
    return (
        <div>
            <h2>Organization ID: {organizationId}</h2>
            <h2>Site ID: {siteId}</h2>
            <h2>Client ID: {clientId}</h2>
            <h2>shortCode: {shortCode}</h2>
        </div>
    )
}

export default SlasDemo
