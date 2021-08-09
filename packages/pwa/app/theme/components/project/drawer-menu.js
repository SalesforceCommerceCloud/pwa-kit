export default {
    baseStyle: {
        container: {},
        socialsContainer: {
            flex: 1,
            justifyContent: 'flex-start'
        },
        icon: {
            color: 'gray.900',
            width: 5,
            height: 5
        },
        logo: {
            width: 12,
            height: 8
        },
        socialsItem: {
            textAlign: 'center',
            paddingLeft: 2,
            paddingRight: 2
        },
        actions: {
            paddingLeft: 4,
            paddingRight: 4
        },
        actionsItem: {
            paddingTop: 3,
            paddingBottom: 3
        },
        localeSelector: {
            paddingTop: 1,
            paddingBottom: 1
        }
    },
    parts: [
        'actions',
        'actionsItem',
        'container',
        'icon',
        'localeSelector',
        'socials',
        'socialsItem'
    ]
}
