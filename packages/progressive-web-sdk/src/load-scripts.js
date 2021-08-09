/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// LabJS is bound to window object - and does not export
import LabJS from '../vendor/lab.src.js' // eslint-disable-line no-unused-vars
import intersection from 'lodash.intersection'

let $
let IS_DEBUG = false
const CACHED_URLS = {}
const INLINE_SCRIPTS = []

const SRC_PROP = 'x-src'
const SELECTOR = `script[${SRC_PROP}], script[type="text/mobify-script"]`
const SEARCHERS = {
    src: ($script, query) => {
        const src = $script.attr(SRC_PROP)

        return (
            src &&
            ($.type(query) === 'regexp' ? query.test(src) : $script.is(`[${SRC_PROP}*="${query}"]`))
        )
    },
    contains: ($script, query) => {
        const src = $script.attr(SRC_PROP)
        const scriptContents = $script.text()

        return (
            !src &&
            ($.type(query) === 'regexp'
                ? query.test(scriptContents)
                : scriptContents.indexOf(query) >= 0)
        )
    }
}

const LoadScripts = function(selectorLibrary) {
    if (LoadScripts.prototype._instance) {
        return LoadScripts.prototype._instance
    }

    LoadScripts.prototype._instance = this
    $ = selectorLibrary

    return this
}

// init only needs to be called once during run-time
LoadScripts.init = function(selectorLibrary, isDebug = false) {
    IS_DEBUG = isDebug

    global.$LAB.setGlobalDefaults({
        // Preserve order of scripts passed to LabJS to ensure script execution order
        AlwaysPreserveOrder: true,
        // Don't re-inject scripts that were previously injected
        AllowDuplicates: false,
        Debug: IS_DEBUG
    })

    return LoadScripts.prototype._instance || new LoadScripts(selectorLibrary)
}

const defaultConfig = {
    evalInGlobalScope: false
}

LoadScripts.prototype.inject = function(url, $response, config = defaultConfig) {
    // Extract the search types from the config
    const searchTypes = {}
    for (const key in config) {
        if (SEARCHERS[key]) {
            searchTypes[key] = config[key]
        }
    }

    // Only process scripts for pages that haven't been scraped
    if (this._isDuplicateSearch(url, searchTypes)) {
        return
    }

    const scripts = this._extract(url, $response, searchTypes)
    const scriptKeys = Object.keys(scripts)

    for (let i = 0; i < scriptKeys.length; i++) {
        const script = scripts[scriptKeys[i]]
        const scriptSrc = script.getAttribute(SRC_PROP)

        if (scriptSrc) {
            global.$LAB.queueScript(scriptSrc)
        } else {
            const html = script.innerHTML
            // LabJS "AllowDuplicates" option doesn't really handle inline
            // scripts - so we need to de-dupe ourselves
            if (INLINE_SCRIPTS.indexOf(html) < 0) {
                // queueWait takes a callback that allows us to run any found
                // inline scripts

                /* eslint-disable no-loop-func */
                global.$LAB.queueWait(() => {
                    INLINE_SCRIPTS.push(html)

                    if (config.evalInGlobalScope) {
                        // On its own, eval executes in its own scope
                        // However, we may want to execute scripts in the global scope
                        // By created a variable that references eval, we are able to make an indirect eval call
                        // Which executes in the global scope
                        // See http://perfectionkills.com/global-eval-what-are-the-options/#indirect_eval_call_theory
                        // for more info
                        const indirectEval = eval // eslint-disable-line no-eval
                        indirectEval(html)
                    } else {
                        eval(html) // eslint-disable-line no-eval
                    }

                    if (IS_DEBUG) {
                        console.log('inline script execution finished:\n', html)
                    }
                })
                /* eslint-enable no-loop-func */
            }
        }
    }

    // Finally, flush the queue and begin injecting scripts in order
    global.$LAB.runQueue()
}

LoadScripts.prototype._extract = function(url, $response, searchTypes) {
    const scripts = $response.find(SELECTOR).toArray()

    // Maintain script order from parsed document by inserting found scripts into
    // container object based on their array index. We'll inject each script into
    // the new document by iterating over the keys of the container
    const container = {}
    for (const searchType in searchTypes) {
        if (searchTypes.hasOwnProperty(searchType)) {
            const searchPatterns = this._getSearchPatterns(searchTypes[searchType])
            const searcher = SEARCHERS[searchType]
            let patternIndex = searchPatterns.length

            // Update our cache of searched-for script patterns, by URL
            CACHED_URLS[url] = CACHED_URLS[url] || {}
            const cachedSearches = CACHED_URLS[url][searchType] || []
            // Merge and de-dupe
            CACHED_URLS[url][searchType] = cachedSearches.concat(
                searchTypes[searchType]
                    .filter((item) => cachedSearches.indexOf(item) < 0)
                    .map((item) => item.toString())
            )

            while (patternIndex--) {
                let scriptIndex = scripts.length

                while (scriptIndex--) {
                    const script = scripts[scriptIndex]

                    if (searcher($(script), searchPatterns[patternIndex])) {
                        container[scriptIndex] = script
                    }
                }
            }
        }
    }

    return container
}

LoadScripts.prototype._getSearchPatterns = function(searchType) {
    if ($.type(searchType) === 'regexp') {
        return [searchType]
    }

    if ($.type(searchType) === 'string') {
        if (searchType.indexOf(',') >= 0) {
            return searchType.replace(/\s/, '').split(',')
        }

        return [searchType]
    }

    return searchType
}

// Check if the search pattern array is a subset of the cached array as a means
// of determining uniqueness
// http://stackoverflow.com/a/14130166
const isSubSet = (arr1, arr2) => {
    return arr2.length === intersection(arr2, arr1).length
}

// Iterate over the provided searchTypes object (which contains arrays keyed by
// search type (i.e. src, contains)), comparing them to our cached dictionary of
// previous searches. If we find any unique entry, return false. Otherwise, true.
LoadScripts.prototype._isDuplicateSearch = function(url, searchTypes) {
    if (typeof CACHED_URLS[url] === 'undefined') {
        return false
    }

    let isDuplicate = false
    for (const searchType in searchTypes) {
        if (searchTypes.hasOwnProperty(searchType)) {
            const searchPatterns = this._getSearchPatterns(searchTypes[searchType]).map((item) =>
                item.toString()
            )
            // If the new search array is a subset of our cached array, it means
            // we've already carried out those searches/extractions
            isDuplicate = isSubSet(CACHED_URLS[url][searchType], searchPatterns)
        }
    }

    return isDuplicate
}

export default LoadScripts
