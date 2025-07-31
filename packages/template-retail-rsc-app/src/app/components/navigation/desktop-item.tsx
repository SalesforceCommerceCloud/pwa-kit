'use client'

import type {ReactElement} from 'react'
import {Link} from 'react-router'
import {ChevronDown} from '@/app/components/icons'
import type {ShopperProductsTypes} from 'commerce-sdk-isomorphic'

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
        <div
            className="relative flex items-center"
            onMouseEnter={onMouseEnter}
            data-sfdc-origin="client"
        >
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
                <button
                    className="ml-0 mt-3 mr-3 mb-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    aria-label={`${category.name} submenu`}
                >
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
            )}
        </div>
    )
}
