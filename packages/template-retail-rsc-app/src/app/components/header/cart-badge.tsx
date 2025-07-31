import type {ReactElement} from 'react'
import {Link} from 'react-router'
import {Cart} from '@/app/components/icons'

/**
 * This component can in the future become the entry-point of a drag&droppable component structure
 * that independently loads its required cart-specific data to display, for example, the number of
 * items in the cart.
 */
export default function CartBadge(): ReactElement {
    return (
        <Link to="/cart" className="relative p-2">
            <Cart className="w-6 h-6 text-gray-700" />

            {/*{itemCount > 0 && (*/}
            {/*    <span*/}
            {/*        className="absolute -top-1 -right-1 bg-primary-600 text-blue-500 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">*/}
            {/*        {itemCount}*/}
            {/*    </span>*/}
            {/*)}*/}
        </Link>
    )
}
