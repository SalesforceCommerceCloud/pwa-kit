import Footer from './footer'

const {baseStyle} = Footer

export default {
    parts: [
        'container',
        'content',
        'horizontalRule',
        'bottomHalf',
        'copyright',
        'creditCardIcon',
        'customerService'
    ],
    baseStyle: {
        container: baseStyle.container,
        content: baseStyle.content,
        horizontalRule: baseStyle.horizontalRule,
        bottomHalf: baseStyle.bottomHalf,
        copyright: baseStyle.copyright,
        creditCardIcon: {
            width: '38px',
            height: '22px'
        },
        customerService: {
            marginBottom: 6
        }
    }
}
