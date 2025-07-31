'use client'

import {type ReactElement, useCallback, useMemo, useState} from 'react'
import {useLocation, useNavigate} from 'react-router'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {ChevronDown} from '@/app/components/icons'
import type {FilterValue} from './types'
import {toRefinesMap, toSearchParams} from './utils'
import ActiveFilters from './activeFilters'
import RefineDefault from './refineDefault'
import RefineCategory from './refineCategory'
import RefineColor from './refineColor'
import RefinePrice from './refinePrice'
import RefineSize from './refineSize'

export default function CategoryRefinements({
    result
}: {
    result: ShopperSearchTypes.ProductSearchResult
}): ReactElement {
    const navigate = useNavigate()
    const location = useLocation()
    const initialExpandedSections = useMemo(() => {
        const params = new URLSearchParams(location.search)
        const refines = params.getAll('refine')
        return refines.map((entry: string) => entry.split('=')[0])
    }, [location])
    const [expandedSections, setExpandedSections] = useState<string[]>(initialExpandedSections)
    const refinements = useMemo(() => result?.refinements || [], [result])

    const toggleFilter = useCallback(
        (attributeId: string, value: string) => {
            const refinesMap = toRefinesMap(location)
            if (refinesMap.has(attributeId) && refinesMap.get(attributeId)?.has(value)) {
                // Attribute already exists in the current refinements --> Remove attribute value
                refinesMap.get(attributeId)?.delete(value)

                // If now the map entry is empty --> Clean it up
                !refinesMap.get(attributeId)?.size && refinesMap.delete(attributeId)
            } else {
                !refinesMap.has(attributeId) && refinesMap.set(attributeId, new Set<string>())
                refinesMap.get(attributeId)?.add(value)
            }

            // Navigate
            const params = toSearchParams(location, refinesMap)
            params.set('page', '1')
            return navigate({
                ...location,
                search: `?${params.toString()}`
            })
        },
        [location]
    )

    // Toggle a filter section expansion
    const toggleSection = useCallback(
        (id: string) => {
            setExpandedSections((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            )
        },
        [location]
    )

    // Check if a filter value is selected
    const isFilterSelected = useCallback(
        (attributeId: string, value: string) => {
            const refinesMap = toRefinesMap(location)
            return refinesMap.get(attributeId)?.has(value) ?? false
        },
        [location]
    )

    // Render the appropriate filter component based on type
    const renderFilterValues = (
        refinement: ShopperSearchTypes.ProductSearchRefinement & {values: FilterValue[]}
    ) => {
        const {values, attributeId} = refinement
        const refinementProps = {
            values,
            attributeId,
            isFilterSelected,
            toggleFilter
        }

        switch (attributeId) {
            case 'cgid':
                return <RefineCategory {...refinementProps} />
            case 'c_refinementColor':
                return <RefineColor {...refinementProps} />
            case 'price':
                return <RefinePrice {...refinementProps} />
            case 'c_size':
                return <RefineSize {...refinementProps} />
            default:
                return <RefineDefault {...refinementProps} />
        }
    }

    // No refinements available
    if (refinements.length === 0) {
        return (
            <div className="border rounded-md p-4">
                <p className="text-gray-600 text-sm">No filter options available.</p>
            </div>
        )
    }

    return (
        <>
            <ActiveFilters result={result} />
            <div className="space-y-6" data-sfdc-origin="client">
                {refinements.map((refinement) => {
                    const {values, attributeId, label} = refinement
                    if (!Array.isArray(values) || !values.length) {
                        return null
                    }

                    return (
                        <div key={attributeId} className="border-b pb-4">
                            {/* Filter Section Header */}
                            <button
                                className="flex items-center justify-between w-full text-left py-2"
                                onClick={() => toggleSection(attributeId)}
                            >
                                <h3 className="text-md font-medium">{label}</h3>
                                <ChevronDown
                                    className={`w-5 h-5 transition-transform ${
                                        expandedSections.includes(attributeId)
                                            ? 'transform rotate-180'
                                            : ''
                                    }`}
                                />
                            </button>

                            {/* Filter Options */}
                            {expandedSections.includes(attributeId) &&
                                renderFilterValues(
                                    refinement as ShopperSearchTypes.ProductSearchRefinement & {
                                        values: FilterValue[]
                                    }
                                )}
                        </div>
                    )
                })}
            </div>
        </>
    )
}
