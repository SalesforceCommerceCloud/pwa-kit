'use client'

import type {ReactElement} from 'react'
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
            {values.map((value) => (
                <label key={value.value} className="flex items-center">
                    <input
                        type="checkbox"
                        checked={isFilterSelected(attributeId, value.value)}
                        onChange={() => toggleFilter(attributeId, value.value)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                        {value.label || value.value}
                        {value.hitCount !== undefined && (
                            <span className="text-gray-500 ml-1">({value.hitCount})</span>
                        )}
                    </span>
                </label>
            ))}
        </div>
    )
}
