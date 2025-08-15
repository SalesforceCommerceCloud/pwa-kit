import type {ReactElement} from 'react'
import CartBadgeTrigger from './cart-badge-trigger'

/**
 * This component can in the future become the entry-point of a drag&droppable component structure
 * that independently loads its required cart-specific data to display, for example, the number of
 * items in the cart. The trigger then on demand lazy-loads and displays a mini cart sheet.
 */
export default function CartBadge(): ReactElement {
    return <CartBadgeTrigger />
}
