'use client'

import type {ReactElement} from 'react'
import {type PropsWithChildren, useEffect, useRef, useState} from 'react'
import {ChevronLeft, ChevronRight} from '@/app/components/icons'

const SCROLL_SIZE = 1200

export default function ProductCarouselControls({
    children,
    title
}: PropsWithChildren<{
    title?: string
}>): ReactElement {
    const scrollContainer = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    // Check if scroll is possible
    const checkScrollable = () => {
        if (scrollContainer.current) {
            const {scrollLeft, scrollWidth, clientWidth} = scrollContainer.current
            setCanScrollLeft(scrollLeft > 16)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5) // 5px tolerance
        }
    }

    // Add scroll event listener
    useEffect(() => {
        const container = scrollContainer.current
        if (container) {
            container.addEventListener('scroll', checkScrollable)
            // Initial check
            checkScrollable()

            return () => {
                container.removeEventListener('scroll', checkScrollable)
            }
        }
    }, [scrollContainer])

    // Scroll left
    const scrollLeft = () => {
        if (scrollContainer.current) {
            scrollContainer.current.scrollBy({left: -SCROLL_SIZE, behavior: 'smooth'})
        }
    }

    // Scroll right
    const scrollRight = () => {
        if (scrollContainer.current) {
            scrollContainer.current.scrollBy({left: SCROLL_SIZE, behavior: 'smooth'})
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6" data-sfdc-origin="client">
                {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}

                <div className="flex space-x-2">
                    <button
                        onClick={scrollLeft}
                        disabled={!canScrollLeft}
                        className="p-2 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft />
                    </button>
                    <button
                        onClick={scrollRight}
                        disabled={!canScrollRight}
                        className="p-2 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Scroll right"
                    >
                        <ChevronRight />
                    </button>
                </div>
            </div>

            <div
                ref={scrollContainer}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-4 gap-4"
                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                data-sfdc-origin="client"
            >
                {children}
            </div>
        </>
    )
}
