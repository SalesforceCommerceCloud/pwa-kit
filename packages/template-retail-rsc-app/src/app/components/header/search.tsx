'use client'

import {type ChangeEvent, type FormEvent, type ReactElement, useCallback, useState} from 'react'
import {useLocation, useNavigate} from 'react-router'
import {Search} from '@/app/components/icons'

export default function SearchBar(): ReactElement {
    const location = useLocation()
    const navigate = useNavigate()
    const [query, setQuery] = useState(location?.state?.query ?? '')

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault()
            if (query.trim()) {
                setQuery('')
                navigate(`/search?q=${encodeURIComponent(query)}`, {
                    state: {query}
                })
            }
        },
        [location, query]
    )

    return (
        <form onSubmit={handleSubmit} className="relative" data-sfdc-origin="client">
            <input
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
                type="submit"
                className="absolute left-0 top-0 p-2 text-gray-500"
                aria-label="Search"
            >
                <Search className="w-5 h-5" />
            </button>
        </form>
    )
}
