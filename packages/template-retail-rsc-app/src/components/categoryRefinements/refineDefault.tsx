'use client'

import type {ReactElement} from 'react'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {Checkbox} from '@/components/ui/checkbox'
import type {FilterValue} from './types'

export default function DefaultRefinement({
    values,
    attributeId,
    isFilterSelected,
    toggleFilter
}: {
    values: FilterValue[]
    attributeId: string
    isFilterSelected: (attributeId: string, value: string) => boolean
    toggleFilter: (attributeId: string, value: string) => void
}): ReactElement {
    return (
        <div className="space-y-1 mt-2">
            {values.map((value: ShopperSearchTypes.ProductSearchRefinementValue, idx) => {
                const id = `refine-${attributeId}-${idx}`
                const isSelected = isFilterSelected(attributeId, value.value)

                return (
                    <label
                        key={`${attributeId}:${value.value}`}
                        htmlFor={id}
                        className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                        <Checkbox
                            id={id}
                            checked={isSelected}
                            onCheckedChange={() => toggleFilter(attributeId, value.value)}
                            className="size-4"
                        />
                        <span className="ml-3 text-sm font-medium">
                            {value.label || value.value}
                        </span>
                        {value.hitCount !== undefined && (
                            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                                {value.hitCount}
                            </span>
                        )}
                    </label>
                )
            })}
        </div>
    )
}
