/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* global Progressive */
const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML = '&nbsp;'

// A fake store
const store = {
    app: {set: () => {}}
}

// Make a fetch request so that the test harness can verify
// behaviour. We take the URL from the 'url' query parameter.
const params = new URLSearchParams(document.location.search.substring(1))
const url = params.get('url')

if (url) {
    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Response is not ok (status code ${response.status})`)
            }
            return response.text()
        })
        .then((text) => {
            rootEl.innerHTML = `<p>${text}</p>`
            Progressive.initialRenderComplete({appState: store})
        })
        .catch(Progressive.initialRenderFailed)
} else {
    Progressive.initialRenderFailed(new Error('No URL query parameter'))
}
