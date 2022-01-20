#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict'

const fs = require('fs')
const uploadBundle = require('../scripts/upload.js')
const Utils = require('../scripts/utils.js')

uploadBundle(options).catch((err) => {
    console.error(err.message || err)
})
