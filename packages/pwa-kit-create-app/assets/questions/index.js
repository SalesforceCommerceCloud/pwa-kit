/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const PRESETS = require('./presets').PRESETS
const PRESET_QUESTIONS = require('./presets').QUESTIONS

const QUESTIONS = [
    ...PRESET_QUESTIONS,
    ...PRESETS
        .filter(({private}) => !private)
        .flatMap((preset) => (preset.questions || []).map(question => ({
            ...question,
            when: (answers) => answers.general.presetId === preset.id,
            presetId: preset.id
        }))
    )
]

module.exports = QUESTIONS
