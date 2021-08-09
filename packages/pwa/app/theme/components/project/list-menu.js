export default {
    baseStyle: {
        container: {
            minWidth: 'xs',
            width: 'full',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            paddingLeft: 4,
            display: {base: 'none', lg: 'flex'}
        },
        stackContainer: {
            whiteSpace: 'nowrap',
            flexWrap: 'wrap'
        },
        popoverContent: {
            marginLeft: 'auto',
            marginRight: 'auto',
            border: 0,
            boxShadow: 'xl',
            paddingTop: 3,
            paddingRight: 4,
            paddingBottom: 4,
            paddingLeft: 4,
            minWidth: '100%',
            borderRadius: 0,
            position: 'absolute'
        },
        popoverContainer: {
            paddingTop: 4,
            paddingBottom: 8,
            maxWidth: 'container.xxxl'
        },
        listMenuTriggerActive: {
            textDecoration: 'none',
            _before: {
                position: 'absolute',
                backgroundColor: 'black',
                content: 'attr(name)',
                height: '2px',
                color: 'transparent',
                bottom: '0px'
            }
        },
        listMenuTrigger: {
            display: 'block',
            whiteSpace: 'nowrap',
            position: 'relative',
            paddingTop: 3,
            paddingRight: 5,
            paddingBottom: 2,
            paddingLeft: 4,
            fontSize: 'md',
            fontWeight: 700,
            color: 'gray.900',
            _hover: {
                textDecoration: 'none'
            }
        }
    },
    parts: [
        'container',
        'listMenuLink',
        'listMenuLinkActive',
        'navLinkTitle',
        'navLinkItem',
        'popoverContent',
        'popoverContainer'
    ]
}
