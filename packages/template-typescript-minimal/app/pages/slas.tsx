import React from 'react'
import {useShopper} from 'slas-react-sdk'

// using multiple components to test
// shared state
const SlasPage = () => {
    return (
        <>
            <SlasDemo />
            <SlasDemo />
        </>
    )
}

const SlasDemo = (props) => {
    const shopper = useShopper()
    console.log(shopper)
    const {_config} = shopper
    const {organizationId, siteId, clientId, shortCode} = _config
    return (
        <div style={{border: '1px solid', margin: '12px'}}>
            <h2>Organization ID: {organizationId}</h2>
            <h2>Site ID: {siteId}</h2>
            <h2>Client ID: {clientId}</h2>
            <h2>shortCode: {shortCode}</h2>
            <h2>isAuthenticated: {shopper.isAuthenticated.toString()}</h2>
            <h2>isInitialized: {shopper.isInitialized.toString()}</h2>
            <h2>accessToken: {shopper.accessToken}</h2>
            <h2>refreshToken: {shopper.refreshToken}</h2>
            <button onClick={shopper.login}>login</button>
        </div>
    )
}

export default SlasPage
