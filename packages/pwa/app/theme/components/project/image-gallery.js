export default {
    baseStyle: {
        container: {},
        heroImage: {},
        heroImageGroup: {
            marginBottom: 2
        },
        thumbnailImageGroup: {},
        thumbnailImageItem: {
            flexShrink: 0,
            cursor: 'pointer',
            flexBasis: [20, 20, 24],
            borderStyle: 'solid',
            marginBottom: [1, 1, 2, 2],
            marginRight: [1, 1, 2, 2],
            _focus: {
                boxShadow: 'outline'
            },
            _focusVisible: {
                outline: 0
            }
        }
    },
    parts: ['container', 'heroImageGroup', 'thumbnailImageGroup']
}
