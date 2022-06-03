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
    const {_config} = shopper
    const {organizationId, siteId, clientId, shortCode} = _config
    return (
        <div style={{border: '1px solid', margin: '12px'}}>
            <p>Organization ID: {organizationId}</p>
            <p>Site ID: {siteId}</p>
            <p>Client ID: {clientId}</p>
            <p>shortCode: {shortCode}</p>
            <h3>authType: {shopper.authType}</h3>
            <h3>isAuthenticated: {shopper.isAuthenticated.toString()}</h3>
            <h3>isInitialized: {shopper.isInitialized.toString()}</h3>
            <h3>isInitializing: {shopper.isInitializing.toString()}</h3>
            <h3>accessToken: {shopper.accessToken}</h3>
            <h3>refreshToken: {shopper.refreshToken}</h3>
            <button onClick={shopper._refreshAccessToken}>start refresh token flow</button>
            <button onClick={shopper.loginAsGuest}>start guest user flow</button>
            <button onClick={shopper.logout}>logout</button>
            <button onClick={() => shopper.login('kev5@test.com', 'Test1234!')}>
                login test user
            </button>
        </div>
    )
}

export default SlasPage
