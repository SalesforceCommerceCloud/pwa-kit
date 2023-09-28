export default {
    baseStyle: (props) => ({
        container: {
            marginBottom: {base: 0, md: 10},
            position: {md: 'relative'}
        },
        stackContainer: {
            align: 'center',
            spacing: {base: 0, md: 4},
            paddingTop: {base: 0, md: 4},
            paddingBottom: {base: 0, md: 4},
            direction: {base: 'column-reverse', md: 'row'},
        },
        imageContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: 'full',
            paddingTop: 0
        }
    }),
    parts: ['container', 'stackContainer', 'imageContainer']
}
