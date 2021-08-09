export default {
    baseStyle: {
        container: {},
        header: {},
        headerTitle: {
            marginBottom: 6
        },
        toolbar: {
            paddingBottom: 4,
            justifyContent: ['flex-start', 'space-between']
        },
        filterButton: {
            marginRight: 2
        },
        sortSelect: {
            height: 11,
            width: 200
        },
        body: {
            columns: [2, 2, 3, 3],
            spacing: 4
        },
        footer: {
            justifyContent: ['center', 'center', 'flex-start'],
            paddingTop: 4,
            paddingBottom: 4
        },
        noResults: {
            direction: 'column',
            alignItems: 'center',
            textAlign: 'center',
            paddingTop: 28,
            paddingBottom: 28
        },
        noResultsIcon: {
            boxSize: [6, 6, 12, 12],
            marginBottom: 5
        },
        noResultsText: {
            fontSize: ['l', 'l', 'xl', '2xl'],
            fontWeight: '700',
            marginBottom: 2
        }
    },
    parts: [
        'header',
        'headerTitle',
        'toolbar',
        'filterButton',
        'sortSelection',
        'body',
        'footer',
        'noResults'
    ]
}
