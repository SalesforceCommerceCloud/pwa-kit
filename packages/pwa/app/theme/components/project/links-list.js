export default {
    parts: ['container', 'list', 'listItem', 'listItemSx', 'heading'],
    baseStyle: {
        container: {
            color: 'white'
        },
        list: {
            fontSize: 'sm'
        },
        heading: {
            fontSize: 'md',
            marginBottom: 4
        }
    },
    variants: {
        vertical: {},
        horizontal: {
            listItem: {
                borderLeft: '1px solid',
                paddingLeft: 2
            },
            listItemSx: {
                '&:first-of-type': {
                    borderLeft: 0,
                    paddingLeft: 0
                }
            }
        }
    },
    defaultProps: {
        variant: 'vertical'
    }
}
