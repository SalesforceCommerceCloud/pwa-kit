import type {ReactElement} from 'react'
import {Suspense} from 'react'
import Hero from '@/app/components/hero'
import ProductCarousel from '@/app/components/productCarousel'
import Features from './features'
import Help from './help'

// Skeleton component for product carousel loading
function ProductCarouselSkeleton() {
    return (
        <div className="py-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex space-x-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="flex-none w-60 md:w-72">
                            <div className="aspect-square bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function Home(): ReactElement {
    return (
        <>
            {/* Hero renders immediately with text as LCP candidate */}
            <Hero
                title="The React Starter Store for High Performers"
                subtitle="Discover our latest collection of products"
                imageUrl="/images/hero.png"
                imageAlt="Hero banner showing products for high performers"
                ctaText="Shop Now"
                ctaLink="/category/root"
            />

            {/* Featured Products with Suspense to prevent blocking */}
            <Suspense fallback={<ProductCarouselSkeleton />}>
                <div className="py-16">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <ProductCarousel title="Shop Products" />
                    </div>
                </div>
            </Suspense>

            {/* Features Section */}
            <div className="py-16">
                <Features />
            </div>

            {/* Help Section */}
            <div className="py-16">
                <Help />
            </div>
        </>
    )
}
