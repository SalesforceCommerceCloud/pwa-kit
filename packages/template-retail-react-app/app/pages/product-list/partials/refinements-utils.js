/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {defineMessage} from 'react-intl'

/** ARIA label for refinement pickers when the option has not been selected. */
export const ADD_FILTER = defineMessage({
    id: 'product_list.refinements.button.assistive_msg.add_filter',
    defaultMessage: 'Add filter: {label}'
})

/** ARIA label for refinement pickers when the option has been selected. */
export const REMOVE_FILTER = defineMessage({
    id: 'product_list.refinements.button.assistive_msg.remove_filter',
    defaultMessage: 'Remove filter: {label}'
})

/**
 * ARIA label for refinement pickers when the option has not been selected.
 * Includes the number of results.
 */
export const ADD_FILTER_HIT_COUNT = defineMessage({
    id: 'product_list.refinements.button.assistive_msg.add_filter_with_hit_count',
    defaultMessage: 'Add filter: {label} ({hitCount})'
})

/**
 * ARIA label for refinement pickers when the option has not been selected.
 * Includes the number of results.
 */
export const REMOVE_FILTER_HIT_COUNT = defineMessage({
    id: 'product_list.refinements.button.assistive_msg.remove_filter_with_hit_count',
    defaultMessage: 'Remove filter: {label} ({hitCount})'
})
