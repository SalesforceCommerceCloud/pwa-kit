'use client'

import type {ReactElement} from 'react'
import type {FilterValue} from './types'

export default function RefineCategory({
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
            {values.map((value) => {
                const isSelected = isFilterSelected(attributeId, value.value)

                return (
                    <label
                        key={value.value}
                        className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFilter(attributeId, value.value)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                        <span className="ml-3 text-sm text-gray-700 font-medium">
                            {value.label || value.value}
                        </span>
                        {value.hitCount !== undefined && (
                            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {value.hitCount}
                            </span>
                        )}
                    </label>
                )
            })}
        </div>
    )
}
