import React from 'react'
import {useShopper} from 'slas-react-sdk'

// using multiple components to test
// shared state
const SlasPage = () => {
    return (
        <>
            <SlasDemo />
            <p>information in both boxes should always be in sync</p>
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
            <h3>Organization ID: {organizationId}</h3>
            <h3>Site ID: {siteId}</h3>
            <h3>Client ID: {clientId}</h3>
            <h3>shortCode: {shortCode}</h3>
            <h3>isAuthenticated: {shopper.isAuthenticated.toString()}</h3>
            <h3>isInitialized: {shopper.isInitialized.toString()}</h3>
            <h3>isInitializing: {shopper.isInitializing.toString()}</h3>
            <h3>accessToken: {shopper.accessToken}</h3>
            <h3>refreshToken: {shopper.refreshToken}</h3>
            <button onClick={shopper._refreshAccessToken}>_refreshAccessToken</button>
        </div>
    )
}

export default SlasPage
