'use client'

import {type JSX, type ReactElement, useMemo} from 'react'
import {Link} from 'react-router'
import type {ShopperProductsTypes} from 'commerce-sdk-isomorphic'

const COLUMNS_MAX = 5

interface CategoryLinksProps {
    category: ShopperProductsTypes.Category
}

const CategoryLinks = ({category}: CategoryLinksProps): ReactElement => {
    const {id, name, categories: subCategories} = category

    const categoryLink = {
        href: `/category/${id}`,
        text: name,
        className: 'text-md mb-2 font-bold'
    }

    const subCategoryLinks = subCategories
        ? subCategories
              .filter((sub) => sub.c_showInMenu)
              .map((subCategory) => ({
                  href: `/category/${subCategory.id}`,
                  text: subCategory.name,
                  className: 'text-md py-3 text-gray-700 hover:text-gray-900'
              }))
        : []

    return (
        <div className="min-w-0 flex-[0_0_21%]">
            <Link to={categoryLink.href} className={`block ${categoryLink.className}`}>
                {categoryLink.text}
            </Link>

            {subCategoryLinks.map((link) => (
                <Link
                    key={link.href}
                    to={link.href}
                    className={`block ${link.className} hover:no-underline`}
                >
                    {link.text}
                </Link>
            ))}
        </div>
    )
}

export default function NavigationDesktopDropdownClient({
    categoryData
}: {
    categoryData: ShopperProductsTypes.Category
}): JSX.Element | null {
    const subCategories = useMemo(() => {
        // Filter categories that should show in menu
        return (categoryData?.categories ?? []).filter(
            (c: ShopperProductsTypes.Category) => c.c_showInMenu
        )
    }, [categoryData])

    const columnsToShow = useMemo(() => {
        return subCategories.length > COLUMNS_MAX ? COLUMNS_MAX : subCategories.length
    }, [subCategories])

    if (subCategories.length === 0) {
        return null
    }

    return (
        <div
            className="grid gap-8 justify-start ml-[68px] xl:ml-24"
            style={{
                gridTemplateColumns: `repeat(${Math.max(columnsToShow, 2)}, minmax(0, 21%))`
            }}
            data-sfdc-origin="client"
        >
            {subCategories.map((subCategory) => (
                <CategoryLinks key={subCategory.id} category={subCategory} />
            ))}
        </div>
    )
}
