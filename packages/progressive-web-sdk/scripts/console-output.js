/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const chalk = require('chalk')

// These aren't really testable in Jest as they need direct access to
// the terminal.

/* istanbul ignore next */
const greenWrite = (text) => process.stdout.write(chalk.green(text))
/* istanbul ignore next */
const redWrite = (text) => process.stdout.write(chalk.red(text))
/* istanbul ignore next */
const printCheckMark = () => greenWrite(' ✓\n')
/* istanbul ignore next */
const printDivider = () => {
    process.stdout.write(chalk.gray('\n----------------------------------------------\n\n'))
}
/* istanbul ignore next */
const plainWrite = (text) => process.stdout.write(text)

module.exports = {
    greenWrite,
    redWrite,
    plainWrite,
    printCheckMark,
    printDivider
}
