/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global Progressive */
const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML =
    `<p>hi from javascript</p><br/>` +
    `<p>window.location is "${window.location}"</p><br/>` +
    `<p>JQuery is ${window.$ ? 'present' : 'missing'}</p>` +
    `<p>window.Progressive.$ is ${window.Progressive.$ ? 'present' : 'missing'}</p>` +
    `<p>CaptureJS is ${window.Capture ? 'present' : 'missing'}</p>` +
    `<p>The request class is ${JSON.stringify(window.Progressive.ssrOptions.requestClass)}</p>`

// Add a <script> with no src to the HEAD to test that filtering
// works as expected.
const srcless = document.createElement('script')
srcless.id = 'srcless'
srcless.innerText = '// This is an empty script'

// Add a <script> with class pw-remove to the head of the document
// to test that it's removed
const removeMe = document.createElement('script')
removeMe.src = 'https://nosuchplace.com/script'
removeMe.classList.add('pw-remove')

const head = document.getElementsByTagName('head')[0]
head.appendChild(srcless)
head.appendChild(removeMe)

const url = new URL(window.location.href)
const responseOptions = {}

const statusCodeString = url.searchParams.get('statusCode')
const statusCode = statusCodeString && parseInt(statusCodeString)
if (statusCode) {
    responseOptions.statusCode = statusCode
}

const headersString = url.searchParams.get('headers')
if (headersString) {
    responseOptions.headers = JSON.parse(headersString)
}

if (url.searchParams.get('suppressBody')) {
    responseOptions.suppressBody = true
}

Progressive.initialRenderComplete({
    appState: {
        app: {
            set: () => {}
        },
        html: '<head><script>I am a script</script><p></p></head>'
    },
    responseOptions
})
