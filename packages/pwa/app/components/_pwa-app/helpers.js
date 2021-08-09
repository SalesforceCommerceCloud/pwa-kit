import {getRootCategoryId} from '../../connector'

/**
 * Convert a category into an object the navigation component understands.
 */
const categoryToNode = (category) => {
    const title = category['name']
    const path = category['id'] === getRootCategoryId() ? '/' : `/category/${category['id']}`
    const children = (category['categories'] || []).map(categoryToNode)

    return {
        title,
        path,
        children
    }
}

export const getNavigationRoot = ({categories}) => {
    return categories
        ? categoryToNode(categories[getRootCategoryId()])
        : {
              title: 'root',
              path: '/'
          }
}

export const getNavigationRootDesktop = (data, maxToplevelCategories = 5) => {
    const root = getNavigationRoot(data)

    if (root.children && root.children.length > maxToplevelCategories) {
        root.children = [
            ...root.children.slice(0, maxToplevelCategories),
            {
                title: 'More',
                path: '/more', // This is set only to ensure the sub menu is expandable.
                children: root.children.slice(maxToplevelCategories)
            }
        ]
    }
    return root
}

export const flattenCategory = (category) => {
    category = category || {children: []}
    const children = category.categories.reduce((a, b) => {
        return Array.isArray(b.categories) && !!b.categories.length
            ? {...a, ...flattenCategory(b)}
            : {...a, [b.id]: b}
    }, {})
    return {
        [category.id]: category,
        ...children
    }
}
