/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const AxeBuilder = require('@axe-core/playwright')
const {expect} = require('@playwright/test')

const {types} = require('util')
const fs = require('fs')
const promisify = require('util').promisify
const statAsync = promisify(fs.stat)
const mkdirAsync = promisify(fs.mkdir)

const isPrompt = (streamData, expectedText) => {
    if (!streamData || !expectedText) return false

    if (types.isRegExp(expectedText)) {
        return streamData.match(expectedText)
    } else return streamData.includes(expectedText)
}

const mkdirIfNotExists = (dirname) => statAsync(dirname).catch(() => mkdirAsync(dirname))

const diffArrays = (expectedArr, actualArr) => {
    const actualSet = new Set(actualArr)
    return [...expectedArr].filter((x) => !actualSet.has(x))
}

const getCreditCardExpiry = (yearsFromNow = 5) => {
    const padMonth = '00'
    return `${(padMonth + (new Date().getMonth() + 1)).slice(-padMonth.length)}/${
        (new Date().getFullYear() % 100) + parseInt(yearsFromNow)
    }`
}
/**
 * Helper function to create simplified violation objects for snapshots
 *
 * @param {Array} violations - Array of axe-core violations
 * @returns {Array} - Array of simplified violation objects
 */
function simplifyViolations(violations) {
    return violations.map((violation) => ({
        id: violation.id, // Rule ID
        impact: violation.impact, // Impact (critical, serious, moderate, minor)
        description: violation.description, // Description of the rule
        help: violation.help, // Short description
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node) => ({
            // Simplify the HTML to make it more stable for snapshots
            html: sanitizeHtml(node.html),
            // Include the important failure information
            failureSummary: node.failureSummary,
            // Simplify target selectors for stability
            // #app-header[data-v-12345] > .navigation[data-testid="main-nav"] => #app-header > .navigation
            target: node.target.map((t) => t.split(/\[.*?\]/).join(''))
        }))
    }))
}
/**
 * Helper function to strip dynamic content from HTML to make snapshots more stable
 *
 * @param {string} html - HTML string
 * @returns {string} - HTML string with dynamic content removed
 */
function sanitizeHtml(html) {
    return (
        html
            // Remove IDs which may change
            .replace(/id="[^"]*"/g, 'id="..."')
            // Remove data attributes which may change
            .replace(/data-[a-zA-Z0-9-]+="[^"]*"/g, '')
            // Simplify classes which may change
            .replace(/class="[^"]*"/g, 'class="..."')
            // Remove inline styles which may change
            .replace(/style="[^"]*"/g, '')
            // Remove content of script tags
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '<script>...</script>')
            // Trim whitespace
            .trim()
    )
}
/**
 * Runs an accessibility analysis on the current page
 *
 * @param {Page} page - Playwright page object
 * @param {string|string[]} snapshotName - Name for the snapshot file
 * @param {Object} options - Optional configuration
 * @param {string[]} options.exclude - CSS selectors to exclude from scan
 */
async function runAccessibilityTest(page, snapshotName, options = {}) {
    const {exclude = []} = options

    // Create AxeBuilder instance
    let axeBuilder = new AxeBuilder({page})

    // Add exclusions if provided
    if (exclude.length > 0) {
        axeBuilder = axeBuilder.exclude(exclude)
    }

    // Run the accessibility audit
    const accessibilityScanResults = await axeBuilder.analyze()

    // console.log(`Found ${accessibilityScanResults.violations.length} accessibility violations`)

    // Create simplified versions of violations for more stable snapshots
    const simplifiedViolations = simplifyViolations(accessibilityScanResults.violations)

    // Convert to JSON string for stable snapshot comparison
    const violationsJson = JSON.stringify(simplifiedViolations, null, 2)

    // Compare with snapshot - using string comparison instead of object comparison
    expect(violationsJson).toMatchSnapshot(snapshotName)
}
/**
 * Generates a random string of given length containing uppercase letters, lowercase letters and numbers.
 * @param {number} length Length of generated string required.
 * @returns Randomly generated alphanumeric string.
 */
const generateRandomString = function (length) {
    let randomString = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
        randomString += characters.charAt(Math.floor(Math.random() * charactersLength))
        counter += 1
    }
    return randomString
}

/**
 * Generates a random valid phone number string
 * @param {number} length Length of generated string required.
 * @returns Randomly generated numeric string.
 */
const generateRandomNumericString = function (length) {
    // US Phone numbers must have the format NXX NXX-XXXX
    // where N cannot be 0 or 1.
    // The area code cannot have 9 in the 2nd digit
    // The middle 3 digits cannot be N11

    let randomPhone = ''
    const validNumbers = '23456789' // exclude 0 or 1 to keep things simple
    const validNumbersLength = validNumbers.length
    let counter = 0
    while (counter < length) {
        randomPhone += validNumbers.charAt(Math.floor(Math.random() * validNumbersLength))
        counter += 1
    }
    return randomPhone
}

/**
 * Generates a random user object containing firstName, lastName, phone, email and password based on locale (Supports en_US and en_GB only).
 * @returns Object containing randomly generated user data.
 */
const generateUserCredentials = function () {
    const user = {}
    user.firstName = generateRandomString(8)
    user.lastName = generateRandomString(8)
    user.phone = '857' + generateRandomNumericString(7)
    user.email = (generateRandomString(12) + '@domain.com').toLowerCase()
    user.password = generateRandomString(15) + 'Ab1!%&*$#@^+:;=?'
    user.address = {}
    user.address.street = generateRandomString(10)
    user.address.city = 'Burlington'
    user.address.state = 'MA'
    user.address.zipcode = '02' + generateRandomNumericString(3)

    return user
}

module.exports = {
    isPrompt,
    mkdirIfNotExists,
    diffArrays,
    getCreditCardExpiry,
    generateUserCredentials,
    runAccessibilityTest
}
