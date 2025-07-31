import type {ReactElement} from 'react'
import {Link} from 'react-router'
import Search from './search'
import CartBadge from './cart-badge'
import NavigationDesktop from '@/app/components/navigation/desktop'

export default function Header(): ReactElement {
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-4">
                        <img
                            className="w-10 h-10 text-blue-500"
                            src="/images/logo.svg"
                            alt="Home"
                        />
                        <div className="text-xl font-bold text-primary-600">Performer</div>
                    </Link>

                    {/* Desktop Navigation */}
                    <NavigationDesktop />

                    {/* Search, Cart */}
                    <div className="flex items-center space-x-4">
                        <Search />
                        <CartBadge />
                    </div>
                </div>
            </div>
        </header>
    )
}
