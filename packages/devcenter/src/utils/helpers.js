import mainNav from '../../mainNavConst'
/**
 * Convert a 2D array to an object with the key is the first item in each array
 * @param array
 *
 * @return {Object}
 */

export const convert2DArrayToObj = (array) => {
    const obj = {}
    for (const [key, ...value] of array) {
        obj[key] = value
    }
    return obj
}

/**
 * Extract part of pathname to get accordion slugs
 * @param pathname - current pathname
 * @return array - array of slugs
 */
export const extractUrls = (pathname) => {
    if (!pathname) return []
    const parts = pathname.split('/').filter(Boolean)
    const results = []
    const mainNavIndex = parts.findIndex((part) => {
        return Object.values(mainNav).includes(part)
    })
    for (const part of parts.slice(2, -1)) {
        const partIndex = parts.indexOf(part)
        results.push('/' + parts.slice(mainNavIndex, partIndex + 1).join('/'))
    }
    return results
}

/**
 * Transform array of externalLinks/internalLinks into nodes data for Nav Component.
 * We need a dummy children to let the Nav have one more nested level for our LeftSidebar content
 * @param {Array} edges - Gatsby Edges
 * @param {Array} externalLinks - external links from config
 * @returns {Object}
 */
export const getNavigationRootMobile = (edges, externalLinks) => {
    const children = [
        ...edges.map(({node: {fields}}) => ({
            title: fields.title,
            path: fields.slug,
            type: 'internal',
            children: [{title: `${fields.slug}-child`, path: `${fields.slug}/child`}]
        })),
        ...externalLinks.map(({title, url}) => ({
            title,
            path: url,
            type: 'external'
        }))
    ]
    return {
        path: '/',
        title: 'Dev Center',
        children
    }
}

export const calculateTreeData = (edges, forcedNavOrder = []) => {
    const tree = edges.reduce(
        (accu, {node}) => {
            const {slug, title, group} = node.fields

            const parts = slug.split('/')
            let {children: prevItems} = accu
            for (const part of parts.slice(2, -1)) {
                let tmp = prevItems.find(({label}) => label === part)
                const slug = parts.slice(0, parts.indexOf(part) + 1).join('/')
                if (tmp) {
                    if (!tmp.children) {
                        tmp.children = []
                    }
                } else {
                    tmp = {
                        label: part,
                        children: [],
                        path: slug,
                        // group,
                        title: part,
                        is_parent: true
                    }
                    prevItems.push(tmp)
                }

                prevItems = tmp.children
            }

            const existingItem = prevItems.find(({label}) => {
                return label === parts[parts.length - 1]
            })

            if (existingItem) {
                existingItem.url = slug
                existingItem.path = slug
                existingItem.title = title
                existingItem.group = group
            } else {
                prevItems.push({
                    label: parts[parts.length - 1],
                    url: slug,
                    path: slug,
                    children: [],
                    title: parts[parts.length - 1],
                    desktopTitle: title,
                    group
                })
            }
            return accu
        },
        {children: []}
    )

    const tmp = [...forcedNavOrder]
    tmp.reverse()
    const forcedOrderData = tmp.reduce((accu, slug) => {
        const parts = slug.split('/')
        let {children: prevItems} = accu

        for (const part of parts.slice(2, -1)) {
            let tmp = prevItems.find(({label}) => label === part)
            if (tmp) {
                if (!tmp.children) {
                    tmp.children = []
                }
            } else {
                tmp = {label: part, children: []}
            }

            const index = tmp.children.findIndex(({label}) => label === parts[parts.length - 1])

            if (index >= 0) {
                tmp.children.unshift(tmp.children.splice(index, 1)[0])
            }
            prevItems = tmp.children
        }

        const index = accu.children.findIndex(
            ({label}) =>
                label === parts[parts.length - 1] ||
                (parts[parts.length - 1] === 'index' && label === parts[parts.length - 2])
        )

        accu.children.unshift(accu.children.splice(index, 1)[0])
        return accu
    }, tree)

    // Grouping content at the root of subfolder
    forcedOrderData.children = forcedOrderData.children.reduce(
        (accu, next) => {
            if (next.group === 'root') {
                accu[0].children.push(next)
            } else {
                accu.push(next)
            }
            return accu
        },
        [{label: 'root', children: [], group: 'root', slug: '/'}]
    )
    return forcedOrderData
}

export const filterSidebarContent = ({edges}, pathname) => {
    if (!pathname) return []
    // Collection name has to match folder's name to make this work
    // Please see gatbsy-config to see collection name.
    const data = edges.filter(({node}) => {
        const {fields} = node
        if (pathname === '/') {
            return fields.collection === 'content'
        } else {
            return pathname.includes(fields.collection)
        }
    })
    return data
}

/**
 * Get the active Path for mobile navigation from current pathname
 * @param pathname
 * @returns {string}
 */
export const getMobileActivePath = (pathname) => {
    const parts = pathname.split('/').filter(Boolean)
    const activeMainNav = parts.find((part) => {
        return Object.values(mainNav).includes(part)
    })

    return activeMainNav ? `/${activeMainNav}` : '/'
}
