/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

jest.mock('@axe-core/playwright', () => jest.fn())
jest.mock('@playwright/test', () => ({expect: jest.fn()}))

const {answerConsentTrackingForm} = require('./pageHelpers')

describe('answerConsentTrackingForm', () => {
    test('waits for auth initialization and the selected DNT state before returning', async () => {
        let releaseAuthInitialization
        const authInitialized = new Promise((resolve) => {
            releaseAuthInitialization = resolve
        })
        const waitForFunction = jest
            .fn()
            .mockImplementationOnce(() => authInitialized)
            .mockResolvedValueOnce(undefined)
        const click = jest.fn().mockResolvedValue(undefined)
        const consentForm = {
            waitFor: jest.fn().mockResolvedValue(undefined)
        }
        const button = {
            and: jest.fn().mockReturnThis(),
            first: jest.fn().mockReturnThis(),
            click
        }
        const page = {
            waitForFunction,
            locator: jest.fn((selector) => {
                if (selector === 'text=Tracking Consent') {
                    return consentForm
                }
                return button
            })
        }

        const answer = answerConsentTrackingForm(page)
        await Promise.resolve()

        expect(click).not.toHaveBeenCalled()

        releaseAuthInitialization()
        await answer

        expect(click).toHaveBeenCalledTimes(1)
        expect(waitForFunction).toHaveBeenCalledTimes(2)
        expect(waitForFunction.mock.calls[1][1]).toBe('0')
    })
})
