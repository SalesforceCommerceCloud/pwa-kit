#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const yargs = require('yargs')
const mobifyTarget = require('./mobify-target')
yargs // eslint-disable-line no-unused-expressions
    .usage('Usage: npm run mobify -- <command> <subcommand> [options]')
    .command('target', 'Manage targets of a project', mobifyTarget)
    .demandCommand(1, 'You need at least one command before moving on')
    .help('h')
    .alias('h', 'help')
    .strict().argv
