export default {
    baseStyle: {
        container: {},
        bigThumbnailImage: {
            maxWidth: '680px'
        },
        bigThumbnail: {
            marginBottom: 2
        },
        smallThumbnails: {
            display: 'grid',
            gridGap: 2,
            gridTemplateColumns: [
                'repeat(auto-fill, 80px)',
                'repeat(auto-fill, 96px)',
                'repeat(auto-fill, 96px)',
                'repeat(auto-fill, 96px)'
            ]
        }
    }
}
