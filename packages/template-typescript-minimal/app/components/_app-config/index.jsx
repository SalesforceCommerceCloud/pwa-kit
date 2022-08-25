import React from 'react'

const AppConfig = (props) => {
    return <div>App config{props.children}</div>
}

AppConfig.restore = () => {}
AppConfig.extraGetPropsArgs = () => {}
AppConfig.freeze = () => {}

export default AppConfig
