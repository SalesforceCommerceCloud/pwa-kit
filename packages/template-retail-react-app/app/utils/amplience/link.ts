import {categoryUrlBuilder, productUrlBuilder} from '../url'
import {EnrichConfig, EnrichConfigMap, processHierarchy} from './enrich'
import {applyRtvToHierarchy} from './rtv'
import {sortBy} from 'lodash'

const categorySchemaId = 'https://sfcc.com/site/navigation/category'

const categoryDKToId = (deliveryKey) => {
    const categoryPrefix = 'category/'

    if (deliveryKey == null || !deliveryKey.startsWith(categoryPrefix)) {
        console.error(`Invalid category delivery key: ${deliveryKey}`)
        return 'invalid'
    }

    return deliveryKey.substring(categoryPrefix.length)
}

const contentPageLinkBuilder = (link) => {
    // Delivery key appears in the reference due to our enrich method.
    if (!link.contentpage?.deliveryKey) {
        return '#'
    }

    return '/' + link.contentpage.deliveryKey
}

const modalContentLinkBuilder = (link) => {
    // Delivery key appears in the reference due to our enrich method.
    if (!link.contentpage?.id) {
        return '#'
    }

    return link.contentpage.id
}

const externalLinkBuilder = (link, forRelative) => {
    return forRelative ? '$' + link.externalUrl : link.externalUrl
}

const internalLinkBuilder = (link) => {
    return link.internalUrl
}

const categoryLinkBuilder = (link) => {
    return categoryUrlBuilder({id: categoryDKToId(link._meta.deliveryKey || link._meta.id)})
}

const noLinkBuilder = () => {
    return undefined
}

const handlers = {
    'https://sfcc.com/site/navigation/external': externalLinkBuilder,
    'https://sfcc.com/site/navigation/internal': internalLinkBuilder,
    'https://sfcc.com/site/navigation/content-page': contentPageLinkBuilder,
    'https://sfcc.com/site/navigation/category': categoryLinkBuilder,
    'https://sfcc.com/site/navigation/group': noLinkBuilder,
    'https://sfcc.com/site/navigation/modal': modalContentLinkBuilder
}

const enumHandlers = {
    URL: (link) => '$' + link.value,
    'Category ID': (link) => categoryUrlBuilder({id: link.value}),
    'Product SKU': (link) => productUrlBuilder({id: link.value}),
    'Page ID': (link) => '/' + link.value
}

export const getLinkUrl = (link, forRelative = true) => {
    // Links can be one of a few content items.

    const builder = handlers[link._meta.schema]

    return builder == null ? '' : builder(link, forRelative)
}

export const getLinkUrlEnum = (link, forRelative = true) => {
    const builder = enumHandlers[link.type]

    return builder == null ? '' : builder(link, forRelative)
}

const navCommonVisible = (item) => item.common.visible
const navCommonOrder = (item) => item.common.priority

const unpackLocale = (obj, targetLocale, noDefault = false) => {
    if (obj == null || typeof obj === 'string') {
        return obj
    }

    let ampTitleObj = obj.values.find(({locale}) => locale === targetLocale)
    const ampTitle = ampTitleObj ? ampTitleObj.value : ''

    if (ampTitle || noDefault) {
        return ampTitle
    }

    ampTitleObj = obj.values.find(({locale}) => locale === 'en-US')
    return ampTitleObj ? ampTitleObj.value : ''
}

const enrichChildrenWithTitle = (children, category) => {
    return children.map((node) => {
        if (!node.common.title) {
            const sfccItem =
                category &&
                category.categories &&
                category.categories.find(({id}) => node._meta.deliveryKey === 'category/' + id)
            node.common.title = sfccItem?.name || ''
        }
        return node
    })
}

const enrichNavContent = (node, targetLocale) => {
    if (node.common && node.common.navcontent) {
        node.common.navcontent.title = unpackLocale(node.common.navcontent.title, targetLocale)

        node.common.navcontent.actions = node.common.navcontent.actions?.map((el) => {
            el.label = unpackLocale(el.label, targetLocale)

            return el
        })
    }
}

const enrichTitle = (targetLocale) => (node) => {
    node.common.title = unpackLocale(node.common.title, targetLocale)

    if (node.externalUrl) {
        node.externalUrl = unpackLocale(node.externalUrl, targetLocale)
    }

    enrichNavContent(node, targetLocale)
}

const navCommonEnrich: EnrichConfig = {
    visibleFunc: navCommonVisible,
    orderFunc: navCommonOrder
}

const navEnrichConfig: EnrichConfigMap = {
    'https://sfcc.com/site/navigation/external': navCommonEnrich,
    'https://sfcc.com/site/navigation/internal': navCommonEnrich,
    'https://sfcc.com/site/navigation/content-page': navCommonEnrich,
    'https://sfcc.com/site/navigation/category': navCommonEnrich,
    'https://sfcc.com/site/navigation/group': navCommonEnrich
}

const sfccToNav = (node, ampChildren, index, visibleFunc) => {
    const children = node.categories
        ? node.categories
              .filter(
                  (category) =>
                      ampChildren == undefined ||
                      ampChildren.findIndex(
                          (ampChild) => ampChild._meta.deliveryKey === 'category/' + category.id
                      ) === -1
              )
              .map((category, index) => sfccToNav(category, undefined, index, visibleFunc))
              .filter((content) => visibleFunc(content))
        : undefined

    return {
        _meta: {
            schema: categorySchemaId,
            deliveryKey: `category/${node.id}`
        },
        common: {
            title: node.name,
            visible: true,
            active: true,
            priority: ((index ?? 0) + 1) * 10
        },
        includeSFCC: false,
        children
    }
}

export const enrichCategory = (categories, targetLocale) => {
    return (node, visibleFunc) => {
        if (node._meta.schema === categorySchemaId) {
            // Search for the category in the SFCC root.
            const categoryId = categoryDKToId(node._meta.deliveryKey)
            const category = categories[categoryId]
            const sfccTitle = category?.name

            let ampTitle
            if (typeof node.common.title === 'string' || node.common.title == null) {
                ampTitle = node.common.title
            } else {
                ampTitle = unpackLocale(node.common.title, targetLocale, true)
            }

            if (ampTitle) {
                node.common.title = ampTitle
            } else if (sfccTitle) {
                node.common.title = sfccTitle
            } else {
                node.common.title = unpackLocale(node.common.title, 'en-US')
            }

            // If the category was found, generate category links for its children.
            if (category && node.includeSFCC) {
                const newChildren = sfccToNav(category, node.children, 0, visibleFunc)
                if (newChildren.children) {
                    node.children = sortBy(
                        [
                            ...enrichChildrenWithTitle(node.children ?? [], category),
                            ...newChildren.children
                        ],
                        'common.priority'
                    )
                }
            }

            enrichNavContent(node, targetLocale)
        } else {
            enrichTitle(targetLocale)(node)
        }
        node.children = node.children
            ? node.children.filter((content) => (visibleFunc ? visibleFunc(content) : true))
            : undefined
    }
}

const getNavEnrichConfig = (categories, locale) => {
    const enrichConfig = {...navEnrichConfig}

    for (let key of Object.keys(enrichConfig)) {
        enrichConfig[key] = {
            enrichFunc:
                key === categorySchemaId ? enrichCategory(categories, locale) : enrichTitle(locale),
            ...enrichConfig[key]
        }
    }

    return enrichConfig
}

export const enrichNavigation = (nav, categories, locale) => {
    const enrichConfig = getNavEnrichConfig(categories, locale)

    processHierarchy(nav, enrichConfig)

    return nav
}

export const applyRtvToNav = (root, rtv, setter, categories, locale) => {
    const enrichConfig = getNavEnrichConfig(categories, locale)

    applyRtvToHierarchy(root, rtv, setter, enrichConfig)
}
