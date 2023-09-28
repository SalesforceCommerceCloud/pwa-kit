export default {
    baseStyle: () => ({
        backIcon: {
            width: '2em',
            height: '2em'
        },
        icons: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '60px',
            alignItems: 'center'
        },
        previewIconClose: {
            top: {base: '45px', sm: '65px'}
        },
        slide: {
            zIndex: {base: 9999, lg: 1300}
        },
        previewIconInitial: {
            top: {base: '52px', sm: '52px', md: '60px', lg: '15px'},
            transition: 'opacity .8s ease-out',
            zIndex: 1200
        },
        previewIcon: {
            left: {base: 4, md: 6, lg: 4},
            top: {base: '5px', sm: '15px'},
            position: 'fixed',
            boxShadow: 'lg',
            backgroundColor: '#F88B8B',
            color: '#fff',
            minWidth: [9, 11],
            height: [9, 11],
            cursor: 'pointer',
            zIndex: 1600,

            _hover: {
                backgroundColor: '#B66869'
            },
            _focus: {
                boxShadow: 'outline'
            },
            _active: {}
        },
        container: {
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'left',
            top: '0px',
            zIndex: 100
        },
        header: {
            textAlign: 'center',
            borderBottomWidth: '1px',
            //padding: {base: '30px 0', lg: '5px 0'},
            paddingLeft: [6, 8],
            paddingRight: [6, 8],
            paddingTop: [6],
            paddingBottom: [6]
        },
        section: {
            borderTop: 'none',
            cursor: 'pointer',
            borderBottomWidth: '1px'
        },
        sectionTitle: {
            fontSize: 'lg',
            margin: '20px 0',
            marginLeft: '20px',
            fontWeight: 'bold'
        },
        button: {
            background: 'gray.50',
            cursor: 'pointer',
            paddingLeft: [4, 4],
            paddingRight: [3, 4],
            paddingTop: [1, 2],
            paddingBottom: [1, 2],
            _hover: {}
        },
        pannel: {
            paddingInlineStart: 0,
            paddingInlineEnd: 0,
            padding: '0 20px 20px 20px'
        },
        box: {
            padding: '20px'
        },
        infoContainer: {
            zIndex: 998,
            position: 'absolute',
            right: '10px',
            top: '10px',
            display: 'flex'
        },
        infoIcon: {
            marginLeft: '5px'
        },
        popoverBody: {
            margin: 2,
            paddingInlineStart: 0,
            paddingInlineEnd: 0
        },
        infoBox: {
            marginRight: '5px',
            width: '12px',
        }
    }),
    parts: ['container']
}
