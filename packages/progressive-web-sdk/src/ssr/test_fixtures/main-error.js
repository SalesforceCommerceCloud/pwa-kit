/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global Progressive */
const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML = `<p>hi from javascript</p><br/><p>JQuery is ${
    window.$ ? 'present' : 'missing'
}</p>`

Progressive.initialRenderFailed(new Error('This is an intentional Error'))
