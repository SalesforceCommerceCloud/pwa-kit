const app = require('./app')

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Running pwa-test-app @ http://127.0.0.1:${PORT}`))
