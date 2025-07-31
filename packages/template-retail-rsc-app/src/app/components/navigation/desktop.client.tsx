'use client'

import {
    lazy,
    type ReactElement,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import {useLocation} from 'react-router'
import type {ShopperProductsTypes} from 'commerce-sdk-isomorphic'
import NavigationDesktopItem from './desktop-item'

const NavigationDesktopDropdownContainer = lazy(() => import('./desktop-dropdown-container'))

export default function NavigationDesktopClient({
    category: rootCategory
}: {
    category: ShopperProductsTypes.Category
}): ReactElement {
    const location = useLocation()
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
    const activeCategoryRef = useRef<ShopperProductsTypes.Category | null>(null)
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const rootCategories = useMemo(() => {
        // Filter categories that should show in menu
        return (rootCategory?.categories ?? []).filter(
            (c: ShopperProductsTypes.Category) => c.c_showInMenu
        )
    }, [rootCategory])

    activeCategoryRef.current = useMemo(() => {
        return (
            (activeCategoryId
                ? rootCategories.find((cat) => cat.id === activeCategoryId)
                : undefined) ?? null
        )
    }, [activeCategoryId, rootCategories])

    const clearCloseTimeout = useCallback((): void => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
    }, [])

    const setCloseTimeout = useCallback(
        (categoryId: string | null = null): void => {
            clearCloseTimeout()
            closeTimeoutRef.current = setTimeout(() => {
                setActiveCategoryId(categoryId)
                closeTimeoutRef.current = null
            }, 150)
        },
        [clearCloseTimeout]
    )

    const handleMouseEnter = useCallback(
        (categoryId: string) => {
            setCloseTimeout(categoryId)
        },
        [setCloseTimeout]
    )

    const handleNavigationLeave = useCallback(() => {
        setCloseTimeout()
    }, [setCloseTimeout])

    const handleDropdownEnter = useCallback((): void => {
        clearCloseTimeout()
    }, [clearCloseTimeout])

    const handleDropdownLeave = useCallback(() => {
        setCloseTimeout()
    }, [setCloseTimeout])

    useEffect(() => {
        // On location/navigation changes we immediately have to update the
        // active category ID to prevent subtle preload issues otherwise
        clearCloseTimeout()
        setActiveCategoryId(null)
    }, [location])

    return (
        <div
            className="hidden lg:flex relative"
            onMouseLeave={handleNavigationLeave}
            data-sfdc-origin="client"
        >
            <nav className="flex" aria-label="Main navigation" role="navigation">
                <div className="flex flex-row items-start justify-start pl-4 w-full min-w-xs">
                    <div className="flex flex-row whitespace-nowrap flex-wrap space-x-0">
                        {rootCategories.map((category) => (
                            <NavigationDesktopItem
                                key={category.id}
                                category={category}
                                isActive={activeCategoryId === category.id}
                                onMouseEnter={() => handleMouseEnter(category.id)}
                            />
                        ))}
                    </div>
                </div>
            </nav>

            {/* Navigation dropdown */}
            {activeCategoryRef.current && activeCategoryRef.current.onlineSubCategoriesCount > 0 ? (
                <div onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
                    <Suspense fallback={<></>}>
                        <NavigationDesktopDropdownContainer category={activeCategoryRef.current} />
                    </Suspense>
                </div>
            ) : null}
        </div>
    )
}
