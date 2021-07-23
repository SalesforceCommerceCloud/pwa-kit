export default {
    variants: {
        subtle: (props) => ({
            container: {
                borderColor: `${props.colorScheme || 'green'}.600`,
                borderWidth: 1,
                borderStyle: 'solid'
            }
        })
    }
}
