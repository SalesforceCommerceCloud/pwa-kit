'use client'

import type {ReactElement} from 'react'
import type {FilterValue} from './types'

export default function RefinePrice({
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
        <div className="space-y-2 mt-2">
            {values.map((value) => {
                const isSelected = isFilterSelected(attributeId, value.value)

                return (
                    <button
                        key={value.value}
                        onClick={() => toggleFilter(attributeId, value.value)}
                        className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                            isSelected
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <span className="font-medium">{value.label || value.value}</span>
                        {value.hitCount !== undefined && (
                            <span
                                className={`ml-2 text-sm ${
                                    isSelected ? 'text-gray-300' : 'text-gray-500'
                                }`}
                            >
                                ({value.hitCount})
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
