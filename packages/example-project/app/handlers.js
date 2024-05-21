import handlers from '*/app/handlers'

export default {
    ...handlers,
    '/from-base-project?*': (req, res) => {
        res.send()
    }
}
