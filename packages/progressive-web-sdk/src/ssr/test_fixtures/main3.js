/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global Progressive */

// Fixtures for testing the JSDOM custom resource loader
// it doesn't matter what's in the files, we're just checking
// if a fetch request happened when expected

const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML = '<p>main3</p>'

const head = document.getElementsByTagName('head')[0]

// The events object is used for checking if the loading behavior
// matches the expectations. If we change how the test logic works,
// we should adjust the expected values accordingly.
const events = {
    firstScript: {
        loaded: false,
        expected: true
    },
    secondScript: {
        loaded: false,
        expected: true
    },
    thirdScript: {
        loaded: false,
        expected: false
    },
    firstStylesheet: {
        loaded: false,
        expected: false
    },
    secondStylesheet: {
        loaded: false,
        expected: false
    },
    image: {
        loaded: false,
        expected: false
    }
}

// A script that should be loaded
// This script will load, and will appear in the head
// because we rewrite the src attribute for paths matching
// the ssrFiles glob patterns
const script = document.createElement('script')
script.src = Progressive.buildUrl + 'no-op.js'
script.onload = () => {
    events.firstScript.loaded = true
}
head.appendChild(script)

// A script that should be loaded
// This script will load, but will not appear in the head
// because we exclude any non-SSR URLs that begin with file://
const script2 = document.createElement('script')
script2.src = Progressive.buildUrl + 'no-op2.js'
script2.id = 'change-me'
script2.onload = () => {
    events.secondScript.loaded = true
}
head.appendChild(script2)
document.getElementById('change-me').src = 'file://some-directory/no-op2.js'

// A script that shouldn't be loaded
// We're using http://localhost to test this script because
// we don't want to load it and we want to check if it's
// appearing in the head
const script3 = document.createElement('script')
script3.src = 'http://localhost:3443/' + 'no-op3.js'
script3.onload = () => {
    events.thirdScript.loaded = true
}
head.appendChild(script3)

// A CSS element that should be loaded
// JSDOM loads CSS through rel='stylesheet'
// link elements in JSDOM don't fire load events
const styles = document.createElement('link')
styles.setAttribute('rel', 'stylesheet')
styles.href = Progressive.buildUrl + 'no-op.css'
styles.onload = () => {
    events.styles.loaded = true
}
head.appendChild(styles)

// A CSS element that shouldn't be loaded
const styles2 = document.createElement('link')
styles2.setAttribute('rel', 'stylesheet')
styles2.href = Progressive.buildUrl + 'no-op2.css'
styles2.onload = () => {
    events.styles.loaded = true
}
head.appendChild(styles2)

// An image element - images should never be loaded
// it shouldn't trigger an event, because it's being
// ignored by the custom resource loader
const image = document.createElement('img')
image.src = Progressive.buildUrl + 'img.png'
image.onload = () => {
    events.image.loaded = true
}
head.appendChild(image)

// Custom resource loader returns null for resources that
// are not to be loaded, so there is no event handler we could
// listen to. Hence the less elegant solution of using a timeout.
setTimeout(() => {
    Progressive.initialRenderComplete({
        appState: {
            app: {
                set: () => {}
            },
            events: events
        }
    })
}, 2000)
