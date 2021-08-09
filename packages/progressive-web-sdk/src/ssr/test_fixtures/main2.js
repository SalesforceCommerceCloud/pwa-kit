/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global Progressive */

const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML = '<p>main2</p>'

const head = document.getElementsByTagName('head')[0]

// Add an extra script to the head.
const script = document.createElement('script')
script.src = Progressive.buildUrl + '/no-op.js'
head.appendChild(script)

Progressive.initialRenderComplete({
    appState: {
        app: {
            set: () => {}
        }
    }
})
