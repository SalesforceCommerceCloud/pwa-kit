#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint @typescript-eslint/no-var-requires: "off" */
const fs = require('fs')
const path = require('path')

const getOutputFolder = () => {
    const outputFolder = 'app/static/translations/compiled'

    return outputFolder
}

module.exports = {
    getOutputFolder
}
