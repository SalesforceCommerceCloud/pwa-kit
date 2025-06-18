/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const QUESTIONS = [
    {
        name: 'project.name',
        // validate: validProjectName,
        message: 'What is the name of your Project?'
    },
    {
        name: 'project.commerce.instanceUrl',
        message: 'What is the URL for your Commerce Cloud instance?'
        // validate: validUrl
    },
    {
        name: 'project.commerce.clientId',
        message: 'What is your SLAS Client ID?'
        // validate: validClientId
    },
    {
        name: 'project.commerce.isSlasPrivate',
        message: 'Is your SLAS client private?',
        type: 'list',
        choices: [
            {
                name: 'Yes',
                value: true
            },
            {
                name: 'No',
                value: false
            }
        ]
    },
    {
        name: 'project.commerce.siteId',
        message: 'What is your Site ID in Business Manager?'
        // validate: validSiteId
    },
    {
        name: 'project.commerce.organizationId',
        message: 'What is your Commerce API organization ID in Business Manager?'
        // validate: validOrganizationId
    },
    {
        name: 'project.commerce.shortCode',
        message: 'What is your Commerce API short code in Business Manager?'
        // validate: validShortCode
    }
]

module.exports = QUESTIONS
