/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* global Progressive */
const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML = '&nbsp;'

// A fake store
const store = {
    app: {set: () => {}}
}

// Make an XMLHttpRequest so that the test harness can verify
// behaviour. We take the URL from the 'url' query parameter.
const params = new URLSearchParams(document.location.search.substring(1))
const url = params.get('url')

if (url) {
    const xhr = new XMLHttpRequest()

    console.log('Creating new XMLHttpRequest')
    xhr.addEventListener('load', () => {
        console.log(`Got response for ${url}`)

        const results = [`<p>responseURL=${xhr.responseURL}</p>`]

        rootEl.innerHTML = results.join('\n')

        Progressive.initialRenderComplete({appState: store})
    })

    xhr.addEventListener('error', Progressive.initialRenderFailed)

    console.log(`Making XMLHttpRequest GET to ${url}`)
    xhr.open('GET', url)
    xhr.send()
} else {
    Progressive.initialRenderComplete({appState: store})
}
