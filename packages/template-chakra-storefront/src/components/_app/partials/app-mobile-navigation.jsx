/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useCategory} from '@salesforce/commerce-sdk-react'
import {Center, Spinner} from '@chakra-ui/react'
import {DrawerMenu} from '../../drawer-menu'
import {HideOnDesktop, HideOnMobile} from '../../responsive'
import {ListMenu, ListMenuContent} from '../../list-menu'
import Fade from '../../fade'
import {withCommerceSdkReact} from '../../with-commerce-sdk-react'
import {useAppConfig} from '../hooks'

const PlaceholderComponent = () => (
    <Center p="2">
        <Spinner size="lg" />
    </Center>
)

const DrawerMenuItemWithData = withCommerceSdkReact(
    ({itemComponent: ItemComponent, data, ...rest}) => (
        <Fade in={true}>
            <ItemComponent {...rest} item={data} itemComponent={DrawerMenuItemWithData} />
        </Fade>
    ),
    {
        hook: useCategory,
        queryOptions: ({item}) => ({
            parameters: {
                id: item.id
            }
        }),
        placeholder: PlaceholderComponent
    }
)

const ListMenuContentWithData = withCommerceSdkReact(
    ({data, ...rest}) => <ListMenuContent {...rest} item={data} />,
    {
        hook: useCategory,
        queryOptions: ({item}) => ({
            parameters: {
                id: item.id,
                levels: 2
            }
        }),
        placeholder: PlaceholderComponent
    }
)

/**
 * AppMobileNavigation component that handles mobile and desktop navigation
 * Renders drawer menu for mobile and list menu for desktop
 */
const AppMobileNavigation = ({categories, isDrawerMenuOpen, onDrawerMenuClose, onLogoClick}) => {
    const {appConfig} = useAppConfig()

    const rootCategory = useMemo(() => {
        return categories?.[appConfig.categoryNav.defaultRootCategory]
    }, [categories, appConfig.categoryNav.defaultRootCategory])

    return (
        <>
            <HideOnDesktop>
                <DrawerMenu
                    isOpen={isDrawerMenuOpen}
                    onClose={onDrawerMenuClose}
                    onLogoClick={onLogoClick}
                    root={rootCategory}
                    itemsKey="categories"
                    itemsCountKey="onlineSubCategoriesCount"
                    itemComponent={DrawerMenuItemWithData}
                />
            </HideOnDesktop>
            <HideOnMobile>
                <ListMenu
                    root={rootCategory}
                    itemsKey="categories"
                    itemsCountKey="onlineSubCategoriesCount"
                    contentComponent={ListMenuContentWithData}
                />
            </HideOnMobile>
        </>
    )
}

AppMobileNavigation.propTypes = {
    categories: PropTypes.object,
    isDrawerMenuOpen: PropTypes.bool.isRequired,
    onDrawerMenuClose: PropTypes.func.isRequired,
    onLogoClick: PropTypes.func.isRequired
}

export default AppMobileNavigation
