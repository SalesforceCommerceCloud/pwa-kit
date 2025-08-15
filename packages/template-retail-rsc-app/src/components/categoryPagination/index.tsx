'use client'

import {type JSX, useCallback, useMemo} from 'react'
import {useLocation, useNavigate} from 'react-router'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {Button} from '@/components/ui/button'
import {ChevronLeft, ChevronRight} from 'lucide-react'

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
        <div className="flex justify-center">
            <nav className="flex items-center space-x-1" aria-label="Pagination">
                {/* Previous button */}
                <Button
                    variant="outline"
                    className="size-9 cursor-pointer"
                    onClick={() => navigatePage(current - 1)}
                    disabled={current <= 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft />
                </Button>

                {/* Page numbers */}
                {pageNumbers.map((page, index) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-700">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={page}
                            onClick={() => navigatePage(page)}
                            disabled={current === page}
                            variant="outline"
                            className="size-9 cursor-pointer"
                            aria-label={`Page ${page}`}
                            aria-current={current === page ? 'page' : undefined}
                        >
                            {page}
                        </Button>
                    )
                )}

                {/* Next button */}
                <Button
                    variant="outline"
                    className="size-9 cursor-pointer"
                    onClick={() => navigatePage(current + 1)}
                    disabled={current === total}
                    aria-label="Next page"
                >
                    <ChevronRight />
                </Button>
            </nav>
        </div>
    )
}
