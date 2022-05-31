const ProductViewStyle = {
    parts: [
        'container',
        'imageGallery',
        'buySection',
        'headingWrapperMobile',
        'headingWrapperDesktop'
    ],
    baseStyle: {
        container: {
            background: 'red.100',
            flexDirection: 'column'
        },
        buySection: {
            align: 'stretch',
            spacing: 8,
            flex: 1,
            marginBottom: [16, 16, 16, 0, 0]
        },
        imageGallery: {
            flex: 1,
            mr: [0, 0, 0, 6, 6]
        },
        headingWrapperMobile: {
            display: ['block', 'block', 'block', 'none']
        },
        headingWrapperDesktop: {
            display: ['none', 'none', 'none', 'block']
        }
    }
    // sizes: {},
    // variants: {},
    // defaultProps: {}
}

export default ProductViewStyle
