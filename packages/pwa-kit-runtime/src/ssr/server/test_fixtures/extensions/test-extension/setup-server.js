const extension = ({app}) => {
    app.get('/test-extension', (req, res) => {
        res.send('test')
    })
}

module.exports = {
    default: extension
}
