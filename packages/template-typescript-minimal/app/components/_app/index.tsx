import React from 'react'
import {Provider} from 'slas-react-sdk'

interface AppProps {
    children?: React.ReactNode
}

const App = ({children}: AppProps) => {
    return (
        <Provider organizationId="1" clientId="2" siteId="3">
            {children}
        </Provider>
    )
}

export default App
