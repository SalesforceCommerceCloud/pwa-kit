'use client'

import type {JSX} from 'react'
import {useCallback, useMemo} from 'react'
import {useLocation, useNavigate} from 'react-router'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {Button} from '@/components/ui/button'
import {X as Close} from 'lucide-react'
import {toRefinesMap, toSearchParams} from './utils'

// Get human-readable label for a specific value
const getValueLabel = (
    attributeId: string,
    value: string,
    refinements: ShopperSearchTypes.ProductSearchRefinement[]
): string => {
    const refinement = refinements.find((r) => r.attributeId === attributeId)
    const valueObj = refinement?.values?.find((v) => v.value === value)
    return valueObj?.label || value
}

export default function CategoryFilters({
    result
}: {
    result: ShopperSearchTypes.ProductSearchResult
}): JSX.Element | null {
    const navigate = useNavigate()
    const location = useLocation()
    const refinements = useMemo(() => result?.refinements || [], [result])

    const activeFilters = useMemo(() => {
        const refinesMap = toRefinesMap(location)
        const filters: Array<{
            attributeId: string
            value: string
            valueLabel: string
        }> = []

        for (const [attributeId, values] of refinesMap) {
            for (const value of values) {
                const valueLabel = getValueLabel(attributeId, value, refinements)
                filters.push({
                    attributeId,
                    value,
                    valueLabel
                })
            }
        }
        return filters
    }, [location.search, refinements])

    // Remove a specific filter
    const removeFilter = useCallback(
        (attributeId: string, value: string) => {
            const refinesMap = toRefinesMap(location)
            if (refinesMap.has(attributeId)) {
                // Remove attribute value
                refinesMap.get(attributeId)?.delete(value)

                // If now the map entry is empty --> Clean it up
                !refinesMap.get(attributeId)?.size && refinesMap.delete(attributeId)
            }

            // Navigate
            const params = toSearchParams(location, refinesMap)
            params.set('page', '1')
            return navigate({
                ...location,
                search: `?${params.toString()}`
            })
        },
        [location, navigate]
    )

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        const params = new URLSearchParams(location.search)
        params.delete('refine')
        params.set('page', '1')

        navigate({
            ...location,
            search: `?${params.toString()}`
        })
    }, [location, navigate])

    // Don't render if no active filters
    if (activeFilters.length === 0) {
        return null
    }

    return (
        <div className="mb-4 border-b">
            <p className="mb-2 font-medium">Active filters:</p>
            <div className="mb-2 flex flex-wrap items-center gap-2">
                {activeFilters.map(({attributeId, value, valueLabel}) => (
                    <Button
                        key={`${attributeId}:${value}`}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => removeFilter(attributeId, value)}
                    >
                        <Close className="size-3" />
                        <span className="ml-1">{valueLabel}</span>
                    </Button>
                ))}
            </div>

            <div className="mb-4">
                <Button
                    variant="link"
                    className="m-0 p-0 cursor-pointer underline text-sm text-destructive hover:text-destructive/75"
                    onClick={clearAllFilters}
                >
                    Clear all
                </Button>
            </div>
        </div>
    )
}
