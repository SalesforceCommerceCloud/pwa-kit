exports.command = function(selector, callback) {
    const client = this
    /*
    / Use Javascript's click when Selenium's does not register.
    */
    client.execute(`document.querySelector("${selector}").click();`, (result) => {
        if (typeof callback === 'function') {
            callback.call(client, result)
        }
    })

    return this
}
