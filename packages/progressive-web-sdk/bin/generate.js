#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */
/* eslint-disable import/no-commonjs */

const consoleOutput = require('../scripts/console-output')
const addContainer = require('../scripts/add-container')
const addComponent = require('../scripts/add-component')
const addForm = require('../scripts/add-form')

const verb = process.argv[2]

switch (verb) {
    case 'page':
    case 'container':
        addContainer()
        break
    case 'component':
        addComponent()
        break
    case 'form':
        addForm()
        break
    default:
        consoleOutput.redWrite('You must provide a valid verb!')
        process.exit()
}
