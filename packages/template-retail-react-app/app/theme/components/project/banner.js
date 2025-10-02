export default {
    parts: ['banner', 'button', 'content', 'background', 'contentContainer', 'contentText'],
    baseStyle: {
        banner: {
            position: 'relative',
            marginBottom: 8,
            overflow: 'hidden'
        },
        videoContainer: {
            marginTop: '-25%'
        },
        contentContainer: {
            display: 'flex'
        },
        content: {
            color: 'white',
            fontSize: '2rem',
            padding: '1rem',
            flexDirection: 'column',
            maxWidth: {
                base: '100%',
                md: '60%'
            }
        },
        contentText: {
            fontWeight: 'bold',
            textShadow: '1px 1px 0px black'
        },
        background: {
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: {
                lg: 'auto',
                base: 'cover'
            },
            maxHeight: '500px',
            width: '100%',
            overflow: 'hidden'
        }
    },
    variants: {
        center: {
            contentContainer: {
                justifyContent: 'center'
            },
            content: {
                height: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
            }
        },
        left: {
            contentContainer: {
                justifyContent: 'start'
            },
            content: {
                height: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'start',
                paddingLeft: '10%',
                textAlign: 'left'
            }
        },
        right: {
            contentContainer: {
                justifyContent: 'end'
            },
            content: {
                height: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'end',
                paddingRight: '10%',
                textAlign: 'right'
            }
        }
    },
    sizes: {
        lg: {
            fontSize: '2rem'
        }
    },
    defaultProps: {
        size: 'lg',
        variant: 'center'
    }
}

