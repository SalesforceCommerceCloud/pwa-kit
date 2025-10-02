export default {
    parts: ['container', 'imageContainer', 'image', 'content', 'heading', 'text'],
    baseStyle: {
        container: {
            marginBottom: 8,
            backgroundColor: '#f8f8f8',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            display: 'flex',
            flexDirection: {
                lg: 'row',
                sm: 'column',
                base: 'column'
            }
        },
        imageContainer: {
            flex: 3
        },
        content: {
            flex: 2,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        },
        heading: {
            fontSize: '2rem',
            textAlign: 'left',
            lineHeight: '1'
        },
        text: {
            fontSize: '1rem'
        },
        image: {}
    },
    variants: {
        left: {
            imageContainer: {
                order: 1
            },
            content: {
                justifyContent: 'center',
                alignItems: 'stretch',
                textAlign: 'left'
            }
        },
        right: {
            imageContainer: {
                order: 0
            },
            content: {
                justifyContent: 'center',
                alignItems: 'stretch',
                textAlign: 'left'
            }
        }
    },
    defaultProps: {
        variant: 'right'
    }
}

