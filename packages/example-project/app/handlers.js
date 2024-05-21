import handlers from '*/app/handlers1'

export default {
    ...handlers,
    '/from-base-project?*': (req, res) => {
        res.send()
    }
}
