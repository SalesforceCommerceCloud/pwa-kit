'use client'

import {type JSX, type ReactElement, useMemo, useEffect, useState} from 'react'
import {Link} from 'react-router'
import type {ShopperProductsTypes} from 'commerce-sdk-isomorphic'
import {useClientSideCategory} from '@/app/utils/api/commerce-client.client'

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

const LoadingIndicator = (): ReactElement => (
    <div className="min-w-0 flex-[0_0_21%] animate-pulse">
        <div className="h-5 bg-gray-200 rounded mb-2"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
        </div>
    </div>
)

export default function NavigationDesktopDropdownClient({
    category
}: {
    category: ShopperProductsTypes.Category
}): JSX.Element | null {
    const {fetchCategory, isCategoryLoading, getCachedCategory} = useClientSideCategory()
    const [categoryWithDeepSubcategories, setCategoryWithDeepSubcategories] =
        useState<ShopperProductsTypes.Category | null>(null)

    // Show first level subcategories immediately (from server data)
    const firstLevelSubCategories = useMemo(() => {
        return (category?.categories ?? []).filter(
            (c: ShopperProductsTypes.Category) => c.c_showInMenu
        )
    }, [category])

    // Fetch deeper subcategories on mount
    useEffect(() => {
        const fetchDeepCategories = async () => {
            if (category?.id && category.onlineSubCategoriesCount > 0) {
                // Check if we already have cached data
                const cached = getCachedCategory(category.id, 2)
                if (cached) {
                    setCategoryWithDeepSubcategories(cached)
                    return
                }

                // Fetch deeper level (levels: 2) for more detailed subcategories
                const deepCategoryData = await fetchCategory(category.id, 2)
                if (deepCategoryData) {
                    setCategoryWithDeepSubcategories(deepCategoryData)
                }
            }
        }

        fetchDeepCategories()
    }, [category?.id, category?.onlineSubCategoriesCount, fetchCategory, getCachedCategory])

    // Use deeper subcategories if available, fallback to first level
    const subCategories = useMemo(() => {
        const sourceCategories =
            categoryWithDeepSubcategories?.categories || firstLevelSubCategories
        return sourceCategories.filter((c: ShopperProductsTypes.Category) => c.c_showInMenu)
    }, [categoryWithDeepSubcategories, firstLevelSubCategories])

    const columnsToShow = useMemo(() => {
        return subCategories.length > COLUMNS_MAX ? COLUMNS_MAX : subCategories.length
    }, [subCategories])

    const isLoading = isCategoryLoading(category?.id || '', 2)

    // If we have no subcategories and not loading, don't show dropdown
    if (subCategories.length === 0 && !isLoading) {
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
            {isLoading && subCategories.length === 0
                ? // Show loading placeholders only if we have no data yet
                  Array.from({length: Math.max(columnsToShow, 2)}).map((_, index) => (
                      <LoadingIndicator key={`loading-${index}`} />
                  ))
                : // Show actual subcategories (either first level immediately, or deeper level when available)
                  subCategories.map((subCategory) => (
                      <CategoryLinks key={subCategory.id} category={subCategory} />
                  ))}
        </div>
    )
}
