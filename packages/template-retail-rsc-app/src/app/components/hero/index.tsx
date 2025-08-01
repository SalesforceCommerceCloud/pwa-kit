import type {ReactElement} from 'react'
import {Link} from 'react-router'
import HeroImage from './heroImage'


export default function Hero({
    title,
    subtitle,
    imageUrl,
    imageAlt,
    ctaText = 'Shop Now',
    ctaLink = '/category/root'
}: {
    title: string
    subtitle?: string
    imageUrl: string
    imageAlt: string
    ctaText?: string
    ctaLink?: string
}): ReactElement {
    return (
        <div className="w-full">
            {/* Two-column layout container */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row w-full min-h-[60vh] md:min-h-[500px]">
                    {/* Left column - Content (prioritized for LCP) */}
                    <div className="w-full md:w-3/5 flex flex-col justify-center p-8 md:p-12 order-1">
                        <div className="max-w-2xl">
                            {/* Make this text MUCH larger to ensure it's the LCP element */}
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                                {title}
                            </h1>

                            {subtitle && (
                                <p className="text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed font-medium">
                                    {subtitle}
                                </p>
                            )}

                            <Link
                                to={ctaLink}
                                className="inline-block text-white bg-blue-600 hover:bg-blue-700 transition-colors py-4 px-10 rounded-lg font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                {ctaText}
                            </Link>
                        </div>
                    </div>

                    {/* Right column - Image */}
                    <div className="w-full md:w-1/2 relative md:h-auto lg:h-[530px]">
                        <img
                            src={imageUrl}
                            alt={imageAlt}
                            fetchPriority="high"
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
