export default {
    parts: ['wrapper', 'image', 'heading'],
    baseStyle: {
        wrapper: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: {
                base: 8,
                xl: 0
            }
        },
        heading: {
            fontSize: '18px',
            fontWeight: 'bold',
            mb: 4
        },
        image: {
            borderRadius: 'full',
            boxSize: '200px'
        }
    }
}

