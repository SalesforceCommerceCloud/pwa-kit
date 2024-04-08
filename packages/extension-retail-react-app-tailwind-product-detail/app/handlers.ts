
// import handlers from '*/app/handlers'

const stores = {
    'store_1': {
        name: 'Coquitlam Central',
        lat: '',
        long: ''
    }
}

module.exports = {
    // ...handlers,
    '/tailwindcss': (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(stores))
    }
}
