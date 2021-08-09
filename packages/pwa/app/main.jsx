/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {start, registerServiceWorker} from 'pwa-kit-react-sdk/dist/ssr/browser/main'

const main = () => {
    return Promise.all([start(), registerServiceWorker('/worker.js')])
}

main()
