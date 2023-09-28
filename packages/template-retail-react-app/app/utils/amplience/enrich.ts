export interface EnrichConfig {
    enrichFunc?: (item: any, visibleFunc?: any) => void,
    visibleFunc?: (item: any) => boolean,
    orderFunc?: (item: any) => number
}

export type EnrichConfigMap = {[key: string]: EnrichConfig}

export const processHierarchy = (node: any, configs: EnrichConfigMap) => {
    const relevantConfig = configs[node._meta?.schema]

    if (node.children) {
        for (let child of node.children) {
            processHierarchy(child, configs)
        }
    }

    if (relevantConfig?.enrichFunc) {
        relevantConfig.enrichFunc(node, relevantConfig.visibleFunc)
    }
}
