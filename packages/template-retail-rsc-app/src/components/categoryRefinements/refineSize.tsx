'use client'

import type {ReactElement} from 'react'
import {Button} from '@/components/ui/button'
import type {FilterValue} from './types'

export default function RefineSize({
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
        <div className="flex flex-wrap gap-2 mt-2">
            {values.map((value) => {
                const isSelected = isFilterSelected(attributeId, value.value)

                return (
                    <Button
                        key={`${attributeId}:${value.value}`}
                        variant="outline"
                        onClick={() => toggleFilter(attributeId, value.value)}
                        className={`${isSelected ? 'border-gray-900' : ''}`}
                    >
                        {value.label || value.value}
                        {value.hitCount !== undefined && (
                            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                                {value.hitCount}
                            </span>
                        )}
                    </Button>
                )
            })}
        </div>
    )
}
