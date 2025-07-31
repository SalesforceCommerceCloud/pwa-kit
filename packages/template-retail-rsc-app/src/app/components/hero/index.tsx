import type {ReactElement} from 'react'
import {Link} from 'react-router'

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
                <div className="flex flex-col md:flex-row w-full">
                    {/* Left column - Content */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
                        <div className="max-w-xl">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                {title}
                            </h1>

                            {subtitle && <p className="text-lg text-gray-700 mb-8">{subtitle}</p>}

                            <Link
                                to={ctaLink}
                                className="inline-block text-white bg-blue-600 hover:bg-blue-700 transition-colors py-3 px-8 rounded-md font-medium"
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
