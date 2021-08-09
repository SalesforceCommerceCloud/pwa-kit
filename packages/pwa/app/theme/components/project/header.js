import theme from '@chakra-ui/theme'

export default {
    baseStyle: {
        container: {
            height: 'full',
            minWidth: 'xs',
            width: 'full',
            boxShadow: 'base',
            backgroundColor: 'white',
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndices.sticky
        },
        content: {
            maxWidth: 'container.xxxl',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: [4, 4, 6, 8],
            paddingRight: [4, 4, 6, 8],
            paddingTop: [1, 1, 2, 4],
            paddingBottom: [3, 3, 2, 4]
        },
        searchContainer: {
            order: [2, 2, 2, 'inherit'],
            width: ['full', 'full', 'full', 60],
            marginRight: [0, 0, 0, 4],
            marginBottom: [1, 1, 2, 0]
        },
        bodyContainer: {
            flex: '1'
        },
        logo: {
            width: [8, 8, 8, 12],
            height: [6, 6, 6, 8]
        },
        icons: {
            marginBottom: [1, 1, 2, 0]
        }
    },
    parts: ['container', 'content', 'searchContainer', 'bodyContainer', 'logo', 'icons']
}
