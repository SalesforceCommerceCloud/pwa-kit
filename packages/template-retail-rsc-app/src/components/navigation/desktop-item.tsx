import type {ReactElement} from 'react'
import {Link} from 'react-router'
import type {ShopperProductsTypes} from 'commerce-sdk-isomorphic'
import {Button} from '@/components/ui/button'
import {ChevronDown} from 'lucide-react'

interface NavigationItemProps {
    category: ShopperProductsTypes.Category
    isActive: boolean
    onMouseEnter: () => void
}

export default function NavigationItem({
    category,
    isActive,
    onMouseEnter
}: NavigationItemProps): ReactElement {
    const hasSubCategories = category.onlineSubCategoriesCount > 0

    return (
        <div className="relative flex items-center" onMouseEnter={onMouseEnter}>
            <Link
                to={`/category/${category.id}`}
                className={`
          relative block px-3 py-2 ml-3 text-md font-bold text-gray-900 whitespace-nowrap
          hover:no-underline transition-colors duration-200
          ${
              isActive
                  ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-black after:content-[""]'
                  : ''
          }
        `}
                data-name={`${category.name} __`}
            >
                {category.name}
            </Link>

            {hasSubCategories && (
                <Button
                    variant="ghost"
                    className="hover:bg-transparent"
                    aria-label={`${category.name} submenu`}
                >
                    <ChevronDown className="size-4" />
                </Button>
            )}
        </div>
    )
}
