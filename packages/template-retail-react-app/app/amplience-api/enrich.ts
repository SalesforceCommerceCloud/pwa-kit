/**
 * Schema IDs for Amplience content link and reference.
 */
const referenceTypes = [
    'http://bigcontent.io/cms/schema/v1/core#/definitions/content-link',
    'http://bigcontent.io/cms/schema/v1/core#/definitions/content-reference'
]

/**
 * An object being enriched, along with its parent and index so it can be replaced if needed.
 */
export interface EnrichTarget {
    item: any;

    parent?: any;
    index?: string | number;
}

/**
 * A strategy for detecting and enriching objects within content items.
 */
export interface EnrichStrategy {
    trigger: (content: any) => boolean;
    enrich: (content: EnrichTarget[]) => Promise<void>;
}

/**
 * Determine if the given object is personalised.
 * @param item The object to check.
 * @returns True if personalised, false otherwise.
 */
export const isPersonalised = (item: any): boolean => {
    return item.enrichType === 'PERSONALISED'
}

/**
 * Determine if the given object is a content reference.
 * @param item The object to check.
 * @returns True if a content reference, false otherwise.
 */
export const isContentReference = (item: any): boolean => {
    return (
        item._meta &&
        referenceTypes.indexOf(item._meta.schema) !== -1 &&
        typeof item.contentType === 'string' &&
        typeof item.id === 'string'
    )
}

/**
 * Recursively scan content for objects that trigger the given enrich strategies.
 * @param item The current object being scanned.
 * @param enrichStrategies Enrich strategies to scan with.
 * @param enrichTargets Arrays to place found enrich targets into.
 * @param parent The parent of the object being scanned.
 * @param index The index into the parent of the object being scanned.
 */
export const getEnrichTargets = (
    item: any,
    enrichStrategies: EnrichStrategy[],
    enrichTargets: EnrichTarget[][],
    parent?: any,
    index?: string | number
) => {
    if (Array.isArray(item)) {
        item.forEach((contained, i) => {
            getEnrichTargets(contained, enrichStrategies, enrichTargets, item, i)
        })
    } else if (item != null && typeof item === 'object') {
        const allPropertyNames = Object.getOwnPropertyNames(item)
        // Does this object match the pattern expected for enrich?

        for (let i = 0; i < enrichStrategies.length; i++) {
            if (enrichStrategies[i].trigger(item)) {
                enrichTargets[i].push({
                    parent,
                    index,
                    item
                })
            }
        }

        allPropertyNames.forEach((propName) => {
            const prop = item[propName]
            if (typeof prop === 'object') {
                getEnrichTargets(prop, enrichStrategies, enrichTargets, item, propName)
            }
        })
    }
}

/**
 * Enrich objects in a given content item using the given enrich strategies.
 * @param item The content item to enrich.
 * @param enrichStrategies Enrich strategies to execute.
 */
export const enrichContent = async (item: any, enrichStrategies: EnrichStrategy[]) => {
    const targets: EnrichTarget[][] = []
    for (let i = 0; i < enrichStrategies.length; i++) {
        targets.push([])
    }

    getEnrichTargets(item, enrichStrategies, targets)

    for (let i = 0; i < enrichStrategies.length; i++) {
        const group = targets[i]
        if (group.length > 0) {
            await enrichStrategies[i].enrich(group)
        }
    }
}
