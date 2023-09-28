export default {
    baseStyle: () => ({
        image: {
            width: '100%',
            filter: 'grayscale(0%)',
            transition: 'all 0.8s ease'
        },
        tile: {
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '20px',
            transition: 'all 0.8s ease'
        },
        title: {
            fontWeight: 'bold'
        },
        blurb: {
            textDecoration: 'none !important'
        }
    }),
    parts: ['image', 'tile', 'title', 'blurb']
}
