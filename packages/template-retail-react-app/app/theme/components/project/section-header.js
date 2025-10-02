export default {
    parts: ['container', 'heading', 'subheading'],
    baseStyle: {
        container: {
            marginBottom: 8
        },
        heading: {
            color: 'gray.900',
            textAlign: 'center',
            marginBottom: '1rem'
        },
        subheading: {
            textAlign: 'center'
        }
    },
    sizes: {
        lg: {
            heading: {
                fontSize: '2rem'
            },
            subheading: {
                fontSize: '1.2rem'
            }
        }
    },
    defaultProps: {
        size: 'lg'
    }
}

