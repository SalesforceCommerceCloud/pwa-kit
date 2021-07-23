import theme from '@chakra-ui/theme'

export default {
    baseStyle: {
        container: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            minWidth: '375px'
        },
        headerWrapper: {
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndices.sticky
        }
    },
    parts: ['container']
}
