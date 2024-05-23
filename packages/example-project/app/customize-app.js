/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import _customizeApp from '*/app/customize-app'

/**
 * 
 * @param options 
 * @param options.app
 */
const customizeApp = ({app, runtime}) => {
    // NOTE: This will be created via the create-app generator.
    // DO NOT REMOVE THIS. YOUR EXTENSIONS WILL NOT WORK IF YOU DO.
    // NOTE: We should havesome conditional logic here to only run this line of code if we are using extensibility, this will 
    // reinforce the idea of only extensions requiring customizing of the app here. 
    // NOTE: Another thought would be to use a loader to "wrap" this enheritance funcitonality, but that is stetchy at best.
    // NOTE: We can also handle this with a custom linter
    _customizeApp({app, runtime})

    // Start customization.
    app.get('/favicon.ico', runtime.serveStaticFile('static/favicon.ico'))

    app.get('/base-project-end-point', (req, res) => {
        res.send()
    })

    // DO NOT REMOVE THIS. YOUR APP WILL BREAK IF YOU DO.
    app.get('*', runtime.render)

    
}


// QUESTION! Should extensions be able to change the runtimes options? 
// 
// ANSWER: No, I don't think so.. but they might want to know the current runtimes configuration in order to 
// check compatibility. E.g. an extension might only want to work for `https` 🤷🏻‍♂️

export default customizeApp