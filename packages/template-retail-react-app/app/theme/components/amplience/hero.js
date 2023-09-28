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
        textContainer: {
            flex: 1,
            spacing: {base: 2, md: 5},
            textAlign: {base: 'center'},
            alignItems: {base: 'center', md: 'unset'},
            backgroundColor: {base: "rgba(255,255,255,0.5)"},
            margin: {base: 4}

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
    variants: {
        full: (props) => ({
            textContainer: {
                flex: 1,
                spacing: {base: 5, md: 8},
                zIndex: 2,
                position: {base: 'unset', md: 'absolute'},
                padding: 8,
                textAlign: {base: 'center'},
                alignItems: {base: 'center', md: 'unset'}
            },
            imageContainer: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                width: 'full',
                marginInlineStart: '0 !important',
                marginTop: '0 !important',
            },
            stackContainer: {
                align: 'center',
                spacing: {base: 0, md: 4},
                paddingTop: 0,
                paddingBottom: 0,
                direction: {base: 'column-reverse', md: 'row'},
                justifyContent: {base: 'center', md: 'unset'}
            },
        }),
        inGrid: (props) => ({
            textContainer: {
                flex: 1,
                zIndex: 2,
                borderRadius: '4px',
                display: 'inline-block',
                padding: '6px 10px',
                width: '70%',
                transition: 'all 0.8s ease',
                background: 'rgba(255, 255, 255, 0.5)'
            },
            container: {
                marginBottom: 0,
                width: '100%',
                height: '100%'
            },
            heading: {
                fontSize: {base: 'md', md: 'xl'}
            },
            image: {
                width: '100%'
            },
            stackContainer: {
                paddingTop: 0,
                paddingBottom: 0
            },
            imageContainer: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                width: 'full',
                marginInlineStart: '0 !important',
                marginTop: '0 !important',
                paddingTop: '0 !important',
            }
        })
    },
    parts: ['container', 'stackContainer', 'imageContainer', 'textContainer']
}
