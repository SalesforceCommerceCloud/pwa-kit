import handlers from '*/app/handlers'

export default {
    ...handlers,
    '/callback?*': (req, res) => {
        res.send()
    }
}
