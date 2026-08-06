/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useMemo, useState} from 'react'
import {Box, Stack, Divider} from '@salesforce/retail-react-app/app/components/shared/ui'
import RefinementDisclosure from '@salesforce/retail-react-app/app/components/refinement-disclosure'
import PropTypes from 'prop-types'
import ColorRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/color-refinements'
import SizeRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/size-refinements'
import RadioRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/radio-refinements'
import CheckboxRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/checkbox-refinements'
import LinkRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/link-refinements'
import {FILTER_ACCORDION_SATE} from '@salesforce/retail-react-app/app/constants'

/** Map of refinement attribute IDs to the components used to display values as filter options. */
export const componentMap = {
    cgid: LinkRefinements,
    c_refinementColor: ColorRefinements,
    c_size: SizeRefinements,
    price: RadioRefinements
}

const Refinements = ({
    itemsBefore,
    excludedFilters = [],
    filters = [],
    toggleFilter,
    selectedFilters,
    isLoading
}) => {
    // Derive the effective (non-excluded) filters and a stable comma-joined key of their
    // attribute IDs. The parent rebuilds the `filters` array on every render, so without
    // memoizing on its contents the default-open set would recompute each time and churn
    // the panel. Keying on the joined-IDs string makes the open-set memo below recompute
    // only when the filter set actually changes. `excludedFilters` is depended on via its
    // joined-string form, not its array identity, so a caller passing a fresh `['cgid']`
    // each render doesn't defeat the memo while a genuine change to the exclusions does.
    const excludedFiltersKey = Array.isArray(excludedFilters) ? excludedFilters.join(',') : ''
    const {effectiveFilters, effectiveFilterIdsString} = useMemo(() => {
        const hasExcludes = Array.isArray(excludedFilters) && excludedFilters.length > 0
        const [filtered, attributeIds] = (Array.isArray(filters) ? filters : []).reduce(
            (acc, filter) => {
                if (!hasExcludes || !excludedFilters.includes(filter.attributeId)) {
                    acc[0].push(filter)
                    acc[1].push(filter.attributeId)
                }
                return acc
            },
            [[], []]
        )
        return {effectiveFilters: filtered, effectiveFilterIdsString: attributeIds.join(',')}
    }, [filters, excludedFiltersKey])

    const allOpenIds = useMemo(
        () => effectiveFilters.map((filter) => filter.attributeId),
        [effectiveFilterIdsString]
    )

    // Seed every panel open — the same state the server renders, so client
    // hydration matches the server HTML. Saved localStorage state can't be read
    // on the server, so it's applied post-hydration by the effect below.
    const [openIds, setOpenIds] = useState(allOpenIds)

    // Apply saved accordion state after hydration, and re-seed when the filter
    // set changes (it arrives empty on the first client render after a navigation
    // and populates once the search resolves). A panel toggle leaves the filter
    // set unchanged, so it never triggers a re-seed.
    useEffect(() => {
        const filterAccordionState = window.localStorage?.getItem?.(FILTER_ACCORDION_SATE)
        const savedOpenIds = filterAccordionState && JSON.parse(filterAccordionState)
        // An empty saved selection means "nothing pinned open", which falls through
        // to all-open — not "collapse everything".
        if (Array.isArray(savedOpenIds) && savedOpenIds.length) {
            setOpenIds(allOpenIds.filter((id) => savedOpenIds.includes(id)))
        } else {
            setOpenIds(allOpenIds)
        }
    }, [effectiveFilterIdsString])

    const toggleOpen = (attributeId) => {
        setOpenIds((current) => {
            const next = current.includes(attributeId)
                ? current.filter((id) => id !== attributeId)
                : [...current, attributeId]
            window.localStorage?.setItem?.(FILTER_ACCORDION_SATE, JSON.stringify(next))
            return next
        })
    }

    return (
        <Stack spacing={8}>
            {effectiveFilters.length > 0 && (
                <Box pointerEvents={isLoading ? 'none' : 'auto'} opacity={isLoading ? 0.2 : 1}>
                    {itemsBefore}

                    {effectiveFilters.map((filter, idx) => {
                        if (!filter.values) {
                            return null
                        }

                        // Render the appropriate component for the refinement type, fallback to checkboxes
                        const Values = componentMap[filter.attributeId] || CheckboxRefinements
                        let selectedFiltersArray = selectedFilters?.[filter.attributeId] ?? []

                        // Catch any non-array values and wrap them in an array
                        if (!Array.isArray(selectedFiltersArray)) {
                            selectedFiltersArray = [selectedFiltersArray]
                        }

                        return (
                            <Stack key={filter.attributeId} divider={<Divider />}>
                                <RefinementDisclosure
                                    isOpen={openIds.includes(filter.attributeId)}
                                    onToggle={() => toggleOpen(filter.attributeId)}
                                    label={filter.label}
                                    paddingTop={idx !== 0 || itemsBefore ? 6 : 0}
                                    paddingBottom={6}
                                    borderColor="gray.200"
                                    borderTopWidth={idx === 0 && !itemsBefore ? 0 : '1px'}
                                    borderBottomWidth={
                                        idx === effectiveFilters.length - 1 ? '1px' : 0
                                    }
                                >
                                    <Values
                                        selectedFilters={selectedFiltersArray}
                                        filter={filter}
                                        toggleFilter={toggleFilter}
                                    />
                                </RefinementDisclosure>
                            </Stack>
                        )
                    })}
                </Box>
            )}
        </Stack>
    )
}

Refinements.propTypes = {
    itemsBefore: PropTypes.arrayOf(PropTypes.element),
    filters: PropTypes.array,
    excludedFilters: PropTypes.arrayOf(PropTypes.string),
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.object,
    isLoading: PropTypes.bool
}

export default Refinements
