import type {ReactElement} from 'react'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'

export default function SearchResultsSummary({
    searchTerm,
    result,
    className = ''
}: {
    searchTerm: string
    result: ShopperSearchTypes.ProductSearchResult
    className?: string
}): ReactElement {
    const totalResults = result.total || 0
    const currentPage = Math.floor((result.offset || 0) / (result.limit || 24)) + 1
    const totalPages = Math.ceil(totalResults / (result.limit || 24))

    return (
        <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-gray-600">
                    <span className="font-medium">{totalResults.toLocaleString()}</span> results for "{searchTerm}"
                    {totalPages > 1 && (
                        <span className="ml-2">
                            (Page {currentPage} of {totalPages})
                        </span>
                    )}
                </div>
                
                {result.suggestedSearchTerms && result.suggestedSearchTerms.length > 0 && (
                    <div className="text-sm">
                        <span className="text-gray-500">Did you mean: </span>
                        {result.suggestedSearchTerms.slice(0, 3).map((term: string, index: number) => (
                            <a
                                key={term}
                                href={`/search?q=${encodeURIComponent(term)}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                {term}
                                {index < Math.min(2, result.suggestedSearchTerms!.length - 1) && ', '}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
