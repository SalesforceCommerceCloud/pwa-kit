const React = require('react')
const GlobalContextProvider = require('./src/context/GlobalContextProvider').default

export const wrapRootElement = ({element}) => (
    <GlobalContextProvider>{element}</GlobalContextProvider>
)
