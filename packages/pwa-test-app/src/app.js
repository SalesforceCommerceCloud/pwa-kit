const express = require('express')

const echo = (req, res) => {
    return res.json({
        protocol: req.protocol,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: req.headers,
        ip: req.ip
    })
}

const app = express()

app.all('*', echo)
app.set('json spaces', 4)

module.exports = app
