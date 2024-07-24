/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const extension = ({app}) => {
    app.get('/test-extension', (req, res) => {
        res.send('test')
    })
}

module.exports = {
    default: extension
}
