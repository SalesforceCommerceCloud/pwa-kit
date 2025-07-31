'use client'

import {type JSX, useCallback, useMemo} from 'react'
import {useLocation, useNavigate} from 'react-router'
import {ChevronLeft, ChevronRight} from '@/app/components/icons'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'

export default function CategoryPagination({
    limit,
    result
}: {
    limit: number
    result: ShopperSearchTypes.ProductSearchResult
}): JSX.Element | null {
    const navigate = useNavigate()
    const location = useLocation()

    const total = useMemo(() => {
        return Math.ceil(result.total / limit)
    }, [limit, result.total])

    const current = useMemo(() => {
        return Math.floor(result.offset / limit) + 1
    }, [limit, result.offset])

    const pageNumbers = useMemo((): (number | 'ellipsis')[] => {
        const pages: (number | 'ellipsis')[] = []

        // Always show first page
        pages.push(1)

        // Logic for middle pages
        if (current > 3) {
            pages.push('ellipsis')
        }

        // Pages around current page
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
            if (i > 1 && i < total) {
                pages.push(i)
            }
        }

        // Ellipsis before last page
        if (current < total - 2) {
            pages.push('ellipsis')
        }

        // Always show last page if more than 1 page
        if (total > 1) {
            pages.push(total)
        }

        return pages
    }, [total, current])

    const navigatePage = useCallback(
        (page: number) => {
            const params = new URLSearchParams(location.search)
            params.set('page', String(page))
            return navigate({
                ...location,
                search: `?${params.toString()}`
            })
        },
        [location]
    )

    if (total <= 1) {
        return null
    }

    return (
        <div className="flex justify-center" data-sfdc-origin="client">
            <nav className="flex items-center space-x-1" aria-label="Pagination">
                {/* Previous button */}
                <button
                    onClick={() => navigatePage(current - 1)}
                    disabled={current <= 1}
                    className="px-2 py-2 rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    aria-label="Previous page"
                >
                    <ChevronLeft />
                </button>

                {/* Page numbers */}
                {pageNumbers.map((page, index) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-700">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => navigatePage(page)}
                            className={`px-4 py-2 rounded-md border ${
                                current === page
                                    ? 'bg-primary-600 text-gray-700 border-primary-600'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            aria-label={`Page ${page}`}
                            aria-current={current === page ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next button */}
                <button
                    onClick={() => navigatePage(current + 1)}
                    disabled={current === total}
                    className="px-2 py-2 rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    aria-label="Next page"
                >
                    <ChevronRight />
                </button>
            </nav>
        </div>
    )
}
