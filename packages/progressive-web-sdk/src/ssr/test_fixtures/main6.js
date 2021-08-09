/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global Progressive */
const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML = '<p>Page content</p>'

const url = new URL(window.location.href)

const head = document.getElementsByTagName('head')[0]
const scriptContents = url.searchParams.get('scriptContents')

const scriptContentsArr = scriptContents.split(',')
scriptContentsArr.forEach((scriptContent) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.innerHTML = scriptContent
    head.appendChild(script)
})

Progressive.initialRenderComplete({
    appState: {
        app: {
            set: () => {}
        }
    }
})
