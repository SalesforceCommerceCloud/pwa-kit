export default {
    baseStyle: {
        container: {display: 'flex'},
        label: {
            width: 'full'
        },
        control: {
            backgroundColor: 'white',
            _checked: {
                backgroundColor: 'blue.600',
                borderColor: 'blue.600',
                _hover: {
                    backgroundColor: 'blue.700',
                    borderColor: 'blue.700'
                }
            },
            _indeterminate: {}
        }
    },
    sizes: {
        md: {
            container: {alignItems: 'flex-start'},
            control: {marginTop: '0.25em'},
            label: {marginLeft: 3}
        }
    }
}
