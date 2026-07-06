/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useEffect, useRef, useState} from 'react'

// Delay before surfacing a feedback alert, so screen readers finish announcing
// the modal close before the alert steals the live-region announcement.
export const ANNOUNCE_DELAY_MS = 300

/**
 * Manages a single order-action feedback banner (e.g. the Cancel or the Return
 * result on the order detail page).
 *
 * Each feedback banner is a nullable `{status, title, description, link?}` object
 * paired with a screen-reader-friendly announce delay: the alert is set on a short
 * timer so an assistive-tech user hears the modal close before the alert content.
 * The timer is cleared before scheduling a new one and on unmount, so a late timer
 * can never fire after the component is gone or after the feedback was intentionally
 * cleared.
 *
 * Cancel and return each own an independent instance so their feedback stays
 * separate — the "Cancelled" badge keys off the cancel result and must never fire
 * on a return success.
 *
 * @param {number} [delayMs=ANNOUNCE_DELAY_MS] - announce delay before the alert is shown.
 * @returns {{feedback: object|null, setFeedback: Function, announce: Function, clear: Function}}
 *   - `feedback` / `setFeedback` — the feedback-state pair (set immediately, e.g. for errors).
 *   - `announce(producer)` — clears any pending timer and schedules `producer` after `delayMs`.
 *   - `clear()` — clears the pending announce timer only (leaves state to the caller).
 */
export const useFeedbackState = (delayMs = ANNOUNCE_DELAY_MS) => {
    const [feedback, setFeedback] = useState(null)
    const timerRef = useRef(null)

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const announce = useCallback(
        (producer) => {
            clear()
            timerRef.current = setTimeout(producer, delayMs)
        },
        [clear, delayMs]
    )

    // Clear any pending timer on unmount so it can't fire after the component is
    // gone (e.g. the shopper navigates away during the announce delay).
    useEffect(() => clear, [clear])

    return {feedback, setFeedback, announce, clear}
}
