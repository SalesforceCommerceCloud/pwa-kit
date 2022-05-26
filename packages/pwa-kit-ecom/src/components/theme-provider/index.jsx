import React from 'react'
import {ChakraProvider} from '@chakra-ui/react'
import defaultTheme from '../../theme'

const ThemeProvider = ({theme = defaultTheme, children}) => {
    return <ChakraProvider theme={theme}>{children}</ChakraProvider>
}

export default ThemeProvider
