import type { ReactElement } from 'react';
import Hero from '@/components/hero';
import ProductCarousel from '@/components/productCarousel';
import Features from './features';
import Help from './help';

export default function Home(): ReactElement {
    return (
        <>
            <Hero
                title="The React Starter Store for High Performers"
                subtitle="Discover our latest collection of products"
                imageUrl="/images/hero.png"
                imageAlt="Hero banner showing products for high performers"
                ctaText="Shop Now"
                ctaLink="/category/root"
            />

            {/* Featured Products */}
            <div className="py-16">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ProductCarousel title="Shop Products" />
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16">
                <Features />
            </div>

            {/* Help Section */}
            <div className="py-16">
                <Help />
            </div>
        </>
    );
}
