'use client'

import {type ReactElement, useCallback, useMemo} from 'react'
import {useLocation, useNavigate} from 'react-router'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'

export default function CategorySorting({
    result
}: {
    result: ShopperSearchTypes.ProductSearchResult
}): ReactElement {
    const navigate = useNavigate()
    const location = useLocation()

    const sortingOptions = useMemo(() => result.sortingOptions, [result.sortingOptions])
    const navigatePage = useCallback(
        (sort: string) => {
            const params = new URLSearchParams(location.search)
            params.set('sort', sort)
            params.set('page', '1')
            return navigate({
                ...location,
                search: `?${params.toString()}`
            })
        },
        [location]
    )

    return (
        <div className="flex items-center space-x-2" data-sfdc-origin="client">
            <label htmlFor="sort" className="text-sm text-gray-600">
                Sort by:
            </label>
            <select
                value={result.selectedSortingOption}
                onChange={(e) => navigatePage(e.target.value)}
                className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent py-2 pl-3 pr-10"
            >
                {sortingOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}
