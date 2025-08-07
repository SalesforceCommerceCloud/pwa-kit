import type {ReactElement} from 'react'
import Hero from '@/app/components/hero'
import ChakraProductScrollerIsland from '@/app/components/chakra/productScroller/island'
import Features from '../home/features'
import Help from '../home/help'

export default function HomeChakra(): ReactElement {
    return (
        <>
            {/* Hero renders immediately with text as LCP candidate - Server Component */}
            <Hero
                title="The React Starter Store with Chakra UI V3"
                subtitle="Discover our latest collection with beautiful Chakra components"
                imageUrl="/images/hero.png"
                imageAlt="Hero banner showing products with Chakra UI styling"
                ctaText="Shop Now"
                ctaLink="/category/root"
            />

            {/* Chakra ProductScroller Island - Client Component */}
            <ChakraProductScrollerIsland title="Shop Products" categoryId="root" limit={8} />

            {/* Features Section - Server Component */}
            <div className="py-16">
                <Features />
            </div>

            {/* Help Section - Server Component */}
            <div className="py-16">
                <Help />
            </div>
        </>
    )
}
