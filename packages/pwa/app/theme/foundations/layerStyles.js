const card = {
    py: 6,
    px: 4,
    backgroundColor: 'white',
    rounded: 'base',
    boxShadow: 'base'
}

const cardBordered = {
    ...card,
    px: [4, 4, 5, 6],
    border: '1px solid',
    borderColor: 'gray.50'
}

export default {
    card,

    cardBordered,

    ccIcon: {
        width: '34px',
        height: '22px'
    },

    page: {
        px: [4, 4, 6, 6, 8],
        paddingTop: [4, 4, 6, 6, 8],
        paddingBottom: 32,
        width: '100%',
        maxWidth: 'container.xxxl',
        marginLeft: 'auto',
        marginRight: 'auto'
    }
}
