'use client'

import type {ReactElement} from 'react'
import type {FilterValue} from './types'

const mapColorNameToHex = (colorName: string): string | null => {
    const colorMap: Record<string, string> = {
        red: '#dc2626',
        blue: '#2563eb',
        green: '#16a34a',
        yellow: '#ca8a04',
        orange: '#ea580c',
        purple: '#9333ea',
        pink: '#db2777',
        brown: '#a16207',
        black: '#000000',
        white: '#ffffff',
        gray: '#6b7280',
        grey: '#6b7280',
        navy: '#1e3a8a',
        beige: '#f5f5dc',
        tan: '#d2b48c',
        gold: '#ffd700',
        silver: '#c0c0c0'
    }

    const normalized = colorName.toLowerCase().trim()
    return colorMap[normalized] || null
}

export default function RefineColor({
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
        <div className="grid grid-cols-2 gap-2 mt-2">
            {values.map((value) => {
                const color = mapColorNameToHex(value.value) || mapColorNameToHex(value.label || '')
                const isSelected = isFilterSelected(attributeId, value.value)

                return (
                    <button
                        key={value.value}
                        onClick={() => toggleFilter(attributeId, value.value)}
                        className={`flex items-center w-full p-2 rounded-md border transition-all ${
                            isSelected
                                ? 'bg-gray-50 border-gray-900'
                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                        {/* Color Circle */}
                        <div
                            className={`relative h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                                isSelected
                                    ? 'border-gray-900'
                                    : 'border-gray-300'
                            }`}
                            style={{backgroundColor: color || '#e5e7eb'}}
                        >
                            {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            color === '#ffffff' || !color ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Color Name and Hit Count */}
                        <div className="flex items-center justify-between flex-1 ml-2 min-w-0">
                            <span className="text-sm text-gray-700 font-medium truncate">
                                {value.label || value.value}
                            </span>
                            {value.hitCount !== undefined && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">
                                    {value.hitCount}
                                </span>
                            )}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
