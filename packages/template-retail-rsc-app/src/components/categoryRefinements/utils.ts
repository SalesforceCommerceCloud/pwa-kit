import type {Location} from 'react-router'

/**
 * Utility function to parse refine parameters into a map.
 */
export const toRefinesMap = (location: Location): Map<string, Set<string>> => {
    const params = new URLSearchParams(location.search)
    return params.getAll('refine').reduce((acc: Map<string, Set<string>>, entry: string) => {
        const [attrId, attrValue] = entry.split('=')
        const attrValues = attrValue.split('|')
        !acc.has(attrId) && acc.set(attrId, new Set<string>())
        for (const val of attrValues) {
            acc.get(attrId)?.add(val)
        }
        return acc
    }, new Map<string, Set<string>>())
}

/**
 * Utility function to turn the current {@link Location} into
 * {@link URLSearchParams} using the given `refine` data.
 */
export const toSearchParams = (
    location: Location,
    refineMap: Map<string, Set<string>>
): URLSearchParams => {
    const params = new URLSearchParams(location.search)
    params.delete('refine')
    for (const [attrId, attrValues] of refineMap) {
        const attrValuesString = [...attrValues].join('|')
        params.append('refine', `${attrId}=${attrValuesString}`)
    }
    return params
}
