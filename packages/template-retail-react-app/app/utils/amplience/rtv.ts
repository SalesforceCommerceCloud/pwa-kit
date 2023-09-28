import {useContext, useEffect} from 'react'
import {AmplienceContext, RealtimeVisualization} from '../../contexts/amplience'
import {EnrichConfigMap} from './enrich'
import {enrichNavigation} from './link'

const processHierarchy = (node, preAction, action) => {
    preAction(node)

    if (node.children) {
        for (let child of node.children) {
            processHierarchy(child, preAction, action)
        }
    }

    action(node)
}

const nodeMatchesRtv = (node: any, rtv: any): boolean => {
    return (
        (node._meta.deliveryKey != null &&
            node._meta.deliveryKey === rtv.content._meta.deliveryKey) ||
        node._meta.deliveryId === rtv.content._meta.deliveryId
    )
}

export const applyRtvToHierarchy = (root, rtv, setter, enrichConfig?: EnrichConfigMap) => {
    let changed = false

    // Alongside enrich, applying rtv to an existing hierarchy can also
    // make that item visible/invisible, or change the order of its parent's children.

    const config = enrichConfig == null ? undefined : enrichConfig[rtv.content._meta.schema]
    const isVisible = config?.visibleFunc ? config.visibleFunc(rtv.content) : true
    const needsOrder = config?.orderFunc != null
    const parentId = rtv.content._meta.hierarchy?.parentId

    processHierarchy(
        root,
        (node) => {
            if (node._meta.deliveryId && node._meta.deliveryId === parentId) {
                // Respect item visibility.

                if (isVisible) {
                    let children = node.children ?? []

                    if (children.findIndex((child) => nodeMatchesRtv(child, rtv)) === -1) {
                        // Add the rtv node as a child
                        children.push({...rtv.content})
                        changed = true
                    }

                    node.children = children
                } else if (node.children) {
                    const index = node.children.findIndex((child) => nodeMatchesRtv(child, rtv))

                    if (index !== -1) {
                        node.children.splice(index, 1)
                        changed = true
                    }
                }
            }
        },
        (node) => {
            if (nodeMatchesRtv(node, rtv)) {
                // Replace this node with the given item.
                if (config?.enrichFunc) {
                    config.enrichFunc(rtv.content, config.visibleFunc)
                }

                // Remove existing properties.
                const keys = Object.keys(node)
                for (let key of keys) {
                    delete node[key]
                }

                Object.assign(node, rtv.content)
                changed = true
            }

            if (needsOrder && node._meta.deliveryId && node._meta.deliveryId === parentId) {
                // Reorder the children.
                node.children.sort((a, b) => {
                    const aPrioFunc = enrichConfig && enrichConfig[a._meta.schema]?.orderFunc
                    const aPrio = aPrioFunc ? aPrioFunc(a) : 0

                    const bPrioFunc = enrichConfig && enrichConfig[b._meta.schema]?.orderFunc
                    const bPrio = bPrioFunc ? bPrioFunc(b) : 0

                    return aPrio - bPrio
                })

                changed = true
            }
        }
    )

    if (changed) {
        setter({...root})
    }
}

export const useAmpRtv = (method, ampVizSdk, captures = []) => {
    if (ampVizSdk === undefined) {
        ampVizSdk = useContext(RealtimeVisualization).ampVizSdk
    }

    const client = useContext(AmplienceContext)?.client

    useEffect(() => {
        let removeChangedSubscription
        let cancelled = false

        if (ampVizSdk !== null) {
            const enrichAndSignal = async (model) => {
                if (client) {
                    await client.defaultEnrich([model], {personalised: true})
                }

                if (!cancelled) {
                    method(model)
                }
            }

            ampVizSdk.form.saved(() => {
                window.location.reload()
            })

            ampVizSdk.form.get().then((model) => {
                enrichAndSignal(model)
            })

            removeChangedSubscription = ampVizSdk.form.changed((model) => {
                enrichAndSignal(model)
            })
        }

        return () => {
            if (removeChangedSubscription != undefined) {
                removeChangedSubscription()
            }
            cancelled = true
        }
    }, [ampVizSdk, ...captures])
}

export const useAmpRtvHier = (method, ampVizSdk, ampClient, filter, enrichMethod, locale) => {
    if (!enrichMethod) {
        enrichMethod = (nav) => nav
    }

    let childContentPromise

    useAmpRtv(async (model) => {
        if (ampClient && !childContentPromise) {
            const meta = model.content._meta
            const lookup = meta.deliveryKey ? {key: meta.deliveryKey} : {id: meta.deliveryId}

            childContentPromise = (async () => {
                const hierarchy = await ampClient.fetchHierarchy(lookup, filter, locale)
                return enrichMethod(hierarchy)
            })()
        }

        const hier = await childContentPromise

        // TODO: Don't run callback when amp rtv effect is cancelled.

        model.content.children = hier.children

        method(model)
    }, ampVizSdk)
}

export const useAmpRtvNav = (method, ampVizSdk, ampClient, categories, locale) => {
    const enrichMethod = (nav) => {
        // Only enrich children of the vis node - the node itself is enriched by the rtv method.

        if (nav.children) {
            for (let child of nav.children) {
                enrichNavigation(child, categories, locale)
            }
        }

        return nav
    }

    useAmpRtvHier(method, ampVizSdk, ampClient, (item) => item.common.visible, enrichMethod, locale)
}
