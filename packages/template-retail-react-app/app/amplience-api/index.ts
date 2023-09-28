import {ContentClient, ContentMeta, ContentReference} from 'dc-delivery-sdk-js'
import {chunk, flatten, intersection, compact} from 'lodash'
import {app} from '../../config/default'
import {
    EnrichTarget,
    isContentReference,
    enrichContent,
    isPersonalised,
    EnrichStrategy
} from './enrich'

export type IdOrKey = {id: string} | {key: string}
export type FilterType = ((item: any) => boolean) | undefined

/**
 * Personalisation variant.
 */
export type Variant = {
    segment: String[];
    content: ContentReference[] | ContentReference;
    match?: string;
    matchMode: 'Any' | 'All';
}

/**
 * Personalised content before enrich.
 */
export type PersonalisedContent = {
    _meta: ContentMeta;
    defaultContent: any[] | any;
    maxNumberMatches: number;
    variants?: Variant[];
}

/**
 * Parameters for fetching content.
 */
export type FetchParams = {
    locale?: string;
    depth?: 'all' | 'root';
    format?: 'inlined';
    client?: ContentClient;
    personalised?: boolean;
}

/**
 * Determine if the given vse has time machine active.
 * @param vse VSE to check.
 * @returns True if time machine is active, false otherwise.
 */
const isTimeMachineVse = (vse: string): boolean => {
    if (vse == null || vse.length === 0) {
        return false
    }

    const dotSplit = vse.split('.')
    const dashSplit = dotSplit[0].split('-')

    return dashSplit.length > 1
}

/**
 * Converts a VSE with time machine active into a regular one.
 * @param vse VSE to convert.
 * @returns A version of the VSE URL without time machine active.
 */
const clearTimeMachine = (vse: string): string => {
    const dotSplit = vse.split('.')
    const dashSplit = dotSplit[0].split('-')

    return [dashSplit[0], ...dotSplit.slice(1)].join('.')
}

/**
 * Default fetch params.
 */
const defaultParams: FetchParams = {
    personalised: true
}

/**
 * Add the fallback locale to a given locale.
 * @param locale The existing locale.
 * @returns The fallback locale.
 */
const addFallback = (locale: string | undefined): string => {
    if (locale == null) {
        return 'en-US,*'
    } else if (locale.indexOf(',') === -1) {
        return locale + ',*'
    }

    return locale
}

/**
 * Combine the given fetch params with the defaults.
 * @param params Options provided by the user.
 * @returns Options for fetch with fallback to defaults.
 */
const addDefaultParams = (params: FetchParams = {}): FetchParams => {
    if (params) {
        return {
            ...defaultParams,
            ...params,
            locale: addFallback(params.locale)
        }
    } else {
        return {
            ...defaultParams
        }
    }
}

/**
 * Get content client fetch params from our fetch params.
 */
const getClientParams = (params: FetchParams): FetchParams => {
    const result: FetchParams = {}

    if (params.locale != null) result.locale = params.locale
    if (params.depth != null) result.depth = params.depth
    if (params.format != null) result.format = params.format

    return result
}

/**
 * Amplience API for fetching content. Supports setting a custom VSE,
 * Hierarchy fetch, personalisation and other helpful features.
 */
export class AmplienceAPI {
    client: ContentClient
    hierarchyClient: ContentClient
    vse: string
    groups: string[]

    clientReady: Promise<void>
    clientReadyResolve

    /**
     * Create the Amplience API.
     */
    constructor() {
        this.clientReady = new Promise((resolve) => (this.clientReadyResolve = resolve))
        this.client = new ContentClient({hubName: app.amplience.default.hub})
        this.hierarchyClient = this.client
    }

    /**
     * Set the personalisation groups for enriching content.
     */
    setGroups(groups) {
        this.groups = groups
    }

    /**
     * Set the vse for fetching content. Must be called before fetch.
     * @param vse Vse URL to use.
     */
    setVse(vse) {
        if (this.vse != vse) {
            this.client = new ContentClient({
                hubName: app.amplience.default.hub,
                stagingEnvironment: vse
            })

            if (isTimeMachineVse(vse)) {
                this.hierarchyClient = new ContentClient({
                    hubName: app.amplience.default.hub,
                    stagingEnvironment: clearTimeMachine(vse)
                })
            } else {
                this.hierarchyClient = this.client
            }

            this.vse = vse
        }

        this.clientReadyResolve()
    }

    /**
     * Fetch content from Dynamic Content in batch.
     * @param args A list of IDs or keys to fetch.
     * @param params Options for fetch.
     * @returns Content or errors returned from Dynamic Content.
     */
    async fetchContent(args: IdOrKey[], params: FetchParams = {}) {
        await this.clientReady

        params = addDefaultParams(params)

        const client = params?.client ?? this.client
        const chunks = chunk(args, 12)

        let responses = await Promise.all(
            chunks.map(
                async (arg: IdOrKey[]) =>
                    (await client.getContentItems(arg, getClientParams(params))).responses
            )
        )

        const items = flatten(responses).map((response) => {
            if ('content' in response) {
                return response.content
            }
            return response.error
        })

        await this.defaultEnrich(
            items.filter((item) => item._meta),
            params
        )

        return items
    }

    /**
     * Enrich content using default enrich strategies.
     * @param items Content items to enrich.
     * @param params Options for fetch.
     */
    async defaultEnrich(items: any[], params: FetchParams = {}) {
        params = addDefaultParams(params)

        const strategies: EnrichStrategy[] = []

        if (params.personalised) {
            strategies.push(this.enrichVariantsStrategy(params.locale))
        }

        for (let item of items) {
            await enrichContent(item, strategies)
        }
    }

    /**
     * Recursively get children of a hierarchy node.
     * @param parent Hierarchy node to get children of.
     * @param filter A method to filter out content.
     */
    async getChildren(parent: any, filter: FilterType, locale: string = 'en-US') {
        const id = parent._meta.deliveryId

        // TODO: pagination, rate limit
        const result = await this.hierarchyClient
            .filterByParentId(id)
            .sortBy('default', 'ASC')
            .request({
                format: 'inlined',
                depth: 'all',
                locale: locale
            })

        const items = result.responses
            .map((response) => response.content)
            .filter((response) => response != null && (!filter || filter(response)))

        if (items.length > 0) {
            parent.children = items
        }

        await Promise.all(items.map((item) => this.getChildren(item, filter)))
    }

    /**
     * Enrich content item references with their delivery keys.
     * @param targets Matching content items.
     * @param locale The locale to fetch with.
     */
    async enrichReferenceDeliveryKeysInternal(targets: EnrichTarget[], locale: string) {
        const ids = new Set<string>(targets.map((target) => target.item.id))

        if (ids.size > 0) {
            const items = await this.fetchContent(
                Array.from(ids).map((id) => ({
                    id
                })),
                {
                    locale,
                    depth: 'root',
                    client: this.hierarchyClient
                }
            )

            for (let item of items) {
                const key = item._meta?.deliveryKey
                if (key) {
                    targets
                        .filter((target) => target.item.id === item._meta.deliveryId)
                        .forEach((target) => (target.item.deliveryKey = key))
                }
            }
        }
    }

    /**
     * Fetch content for a personalised container based on the active groups.
     * @param props Personalised container with variants.
     * @param params Fetch params.
     * @returns Matching content and variants.
     */
    async getVariantsContent(props: PersonalisedContent, params) {
        const {
            variants = [],
            maxNumberMatches = 1,
            defaultContent
        } = props
        const matchesList = [{
            title: 'Default variant',
            isDefault: true,
            match: false
        }]
        let maxNumberCounter = 0

        const matches = compact(
            variants.map((arg: Variant, ind: number) => {
                const similar = intersection(arg.segment, this.groups)
                const matchObj = {
                    title: `${ind + 1} - (${arg.matchMode}) ${similar.join(', ')}`,
                    match: true,
                    isDefault: false,
                    maxReached: false
                }
                if (
                    arg.matchMode == 'Any'
                        ? similar.length == 0
                        : similar.length < arg.segment.length
                ) {
                    matchObj.title = `${ind + 1} - (${arg.matchMode}) ${arg.segment.join(', ')}`
                    matchObj.match = false
                    matchesList.push(matchObj)
                    return null
                }

                maxNumberCounter += 1
                if (maxNumberCounter > maxNumberMatches) {
                    matchObj.maxReached = true
                }
                matchesList.push(matchObj)
                return arg
            })
        )

        let responses = await Promise.all(
            matches.slice(0, maxNumberMatches).map(async (arg: Variant) => {
                let rawIds: ('' | {id: string})[]

                if (arg.content == null) {
                    arg.content = []
                }

                if (Array.isArray(arg.content)) {
                    arg.content = arg.content.map((el) => ({
                        ...el,
                        matchesList
                    })) as any[]
                    rawIds = arg.content.map(({id}) => id && {id})
                } else {
                    rawIds = [arg.content.id && {id: arg.content.id}]
                }

                const ids = compact(rawIds)

                if (!ids || !ids.length) {
                    return Promise.resolve(arg)
                }

                const content = (await this.client.getContentItems(ids, params)).responses
                const mappedContent: any = content.map((response) => {
                    if ('content' in response) {
                        return {
                            ...response.content,
                            matchesList
                        }
                    }
                    return response.error
                })

                return {
                    ...arg,
                    content: mappedContent
                }
            })
        )

        let allContent = flatten(responses.map((response) => response.content))

        if (allContent.length === 0) {
            if (defaultContent == null) {
                allContent = []
            } else if (Array.isArray(defaultContent)) {
                allContent = [
                    ...defaultContent.map((el) => {
                        matchesList[0].match = true
                        el.matchesList = matchesList
                        return el
                    })
                ]
            } else {
                matchesList[0].match = true
                allContent = [{...defaultContent, matchesList}]
            }
        }

        return {
            ...props,
            variants: responses,
            content: allContent
        }
    }

    /**
     * Enrich personalised containers with matching content based on active groups.
     * @param targets Matching objects in content items.
     * @param locale The locale to fetch with.
     */
    async enrichVariantsInternal(targets: EnrichTarget[], locale: string) {
        for (let target of targets) {
            const item = target.item
            Object.assign(item, await this.getVariantsContent(item, {locale}))
        }
    }

    /**
     * Get an enrich strategy for personalisation.
     * @param locale Locale to fetch with.
     * @returns An enrich strategy for personalisation.
     */
    enrichVariantsStrategy(locale = 'en-US') {
        return {
            trigger: isPersonalised,
            enrich: (targets: EnrichTarget[]) => this.enrichVariantsInternal(targets, locale)
        }
    }

    /**
     * Enrich content item references with their delivery keys.
     * @param item Item to search for missing delivery keys.
     * @param locale Locale to fetch with.
     */
    async enrichReferenceDeliveryKeys(item: any, locale = 'en-US') {
        await enrichContent(item, [
            {
                trigger: isContentReference,
                enrich: (targets: EnrichTarget[]) =>
                    this.enrichReferenceDeliveryKeysInternal(targets, locale)
            }
        ])
    }

    /**
     * Fetch all items of a content hierarchy.
     * @param parent Id or Key of a root node in a hierarchy.
     * @param filter A method to filter out content.
     * @param locale Locale to fetch with.
     * @returns The hierarchy with child nodes stored in `children`.
     */
    async fetchHierarchy(parent: IdOrKey, filter: FilterType, locale = 'en-US') {
        await this.clientReady

        const root = (await this.fetchContent([parent], {locale, client: this.hierarchyClient}))[0]

        if (!root._meta) {
            // Root node is missing. Return the error with an empty children array.

            root.children = []

            return root
        }
 
        await this.getChildren(root, filter, locale)
        
        await this.enrichReferenceDeliveryKeys(root, locale)
        
        return root
    }

    /**
     * Fetch the hierarchy root content item given an id of a hierarchy node.
     * @param childId A hierarchy node ID.
     * @param locale Locale to fetch with.
     * @returns The hierarchy root content item.
     */
    async fetchHierarchyRootFromChild(childId: string, locale = 'en-US') {
        await this.clientReady

        let root: any = undefined

        do {
            root = (
                await this.fetchContent([{id: childId}], {locale, client: this.hierarchyClient})
            )[0]

            childId = root._meta.hierarchy?.parentId
        } while (childId != null)

        return root
    }

    stringScore(string: string, filter: string, threshold: number): number {
        const stringWords = string.split(' ')
        const filterWords = filter.split(' ')
        let score = 0;

        for (let stringWord of stringWords) {
            if (stringWord.length === 0) continue;

            for (let filterWord of filterWords) {
                if (filterWord.length === 0) continue;

                const index = stringWord.indexOf(filterWord)

                if (index > -1) {
                    let wordScore = 1
                    if (index === 0) wordScore *= 2
                    if (index + filterWord.length === stringWord.length) wordScore *= 1.5

                    if (wordScore >= threshold) {
                        score += wordScore;
                    }
                }
            }
        }

        return score;
    }

    pageScore(page, filter: string): number {
        let score = 0;
        score += this.stringScore(page.content?.seo?.title?.toLowerCase(), filter, 1);
        score += this.stringScore(page.content?.seo?.keywords?.toLowerCase(), filter, 1) * 0.5;
        score += this.stringScore(page.content?.seo?.description?.toLowerCase(), filter, 2) * 0.2;

        return score;
    }

    filterPages(pages, filter: string) {
        filter = filter.toLowerCase();

        const results = pages.map(page => ({page, score: this.pageScore(page, filter)})).filter(item => item.score > 0);
        results.sort((a, b) => b.score - a.score)

        return results.map(item => item.page)
    }

    async getSearchableContentPages(locale = 'en-US', filter: string) {
        await this.clientReady
        
        const result = await this.client
            .filterByContentType('https://sfcc.com/site/pages/content-page')
            .filterBy("/active", true)
            .request({locale: locale + ',*'})

        return filter == null ?
            result.responses :
            this.filterPages(result.responses, filter);
    }
}

/**
 * The default Amplience client.
 */
export const defaultAmpClient = new AmplienceAPI()
