'use client'

import {type FormEvent, type ReactElement, useCallback, useRef} from 'react'
import {useNavigate} from 'react-router'
import {Input} from '@/components/ui/input'
import {Search} from 'lucide-react'

/**
 * @see {@link https://github.com/shadcn-ui/ui/discussions/1552}
 */
export default function SearchBar(): ReactElement {
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault()
            if (inputRef.current?.value?.trim()) {
                const query = inputRef.current.value
                navigate(`/search?q=${encodeURIComponent(query)}`, {
                    state: {query}
                })
            }
        },
        [inputRef]
    )

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search"
                    className="peer w-full pl-10"
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2" />
            </div>
        </form>
    )
}
