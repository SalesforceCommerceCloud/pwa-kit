'use client'

import {type ReactElement, useCallback, useMemo} from 'react'
import {useLocation, useNavigate} from 'react-router'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion'
import type {FilterValue} from './types'
import {toRefinesMap, toSearchParams} from './utils'
import ActiveFilters from './activeFilters'
import RefineDefault from './refineDefault'
import RefineColor from './refineColor'
import RefineSize from './refineSize'

export default function CategoryRefinements({
    result
}: {
    result: ShopperSearchTypes.ProductSearchResult
}): ReactElement {
    const navigate = useNavigate()
    const location = useLocation()
    const expandedSections = useMemo(() => {
        const params = new URLSearchParams(location.search)
        const refines = params.getAll('refine')
        return refines.map((entry: string) => entry.split('=')[0])
    }, [location])
    const refinements = useMemo(() => result?.refinements || [], [result])

    const toggleFilter = useCallback(
        (attributeId: string, value: string) => {
            const refinesMap = toRefinesMap(location)
            if (refinesMap.has(attributeId) && refinesMap.get(attributeId)?.has(value)) {
                // Attribute already exists in the current refinements --> Remove attribute value
                refinesMap.get(attributeId)?.delete(value)

                // If now the map entry is empty --> Clean it up altogether
                !refinesMap.get(attributeId)?.size && refinesMap.delete(attributeId)
            } else {
                !refinesMap.has(attributeId) && refinesMap.set(attributeId, new Set<string>())
                if (attributeId === 'price') {
                    // Price refinements turn out to be exclusive, i.e. it doesn't seem to be
                    // considered legit by the SCAPI to refine for multiple price ranges. Needs
                    // verification whether this is just a usage/syntax issue here.
                    refinesMap.get(attributeId)?.clear()
                }
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
        const {attributeId, values} = refinement
        const refinementProps = {
            values,
            attributeId,
            isFilterSelected,
            toggleFilter
        }

        switch (attributeId) {
            case 'c_refinementColor':
                return <RefineColor {...refinementProps} />
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
            {/* The currently active filters section */}
            <ActiveFilters result={result} />

            {/* Accordion to display the available refinement categories */}
            <Accordion type="multiple" defaultValue={expandedSections}>
                {refinements.map((refinement) => {
                    const {values, attributeId, label} = refinement
                    if (!Array.isArray(values) || !values.length) {
                        return null
                    }

                    return (
                        <AccordionItem key={attributeId} value={attributeId}>
                            <AccordionTrigger>{label}</AccordionTrigger>
                            <AccordionContent>
                                {renderFilterValues(
                                    refinement as ShopperSearchTypes.ProductSearchRefinement & {
                                        values: FilterValue[]
                                    }
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </>
    )
}
