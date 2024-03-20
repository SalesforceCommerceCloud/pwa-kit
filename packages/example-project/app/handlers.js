export default ({app, runtime}) => {
    // Handle the redirect from SLAS as to avoid error
    app.get('/callback?*', (req, res) => {
        res.send()
    })

    app.get('/favicon.ico', runtime.serveStaticFile('static/favicon.ico'))

    app.get('*', runtime.render)
}