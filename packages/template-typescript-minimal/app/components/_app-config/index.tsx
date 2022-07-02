import React from 'react'
import {SCAPIProvider} from '../../provider'

const AppConfig = ({children}) => {
    return <SCAPIProvider>{children}</SCAPIProvider>
}

AppConfig.restore = (locals = {}) => {}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {}

export default AppConfig
