/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/*
 This file is shared between SDK code and the command-line uploader.
 */

import minimatch from 'minimatch'

/**
 * The minimatch options we use. Behaviour is intended to match that
 *
 * @private
 * @type {{nocomment: boolean}}
 */
const STANDARD_OPTIONS = {
    nocomment: true
}

/**
 * A Matcher class is constructed with a list of minimatch glob patterns.
 * Once constructed, it can efficiently test whether a given file path
 * matches any of those patterns. Empty patterns are ignored.
 *
 * @private
 */
export class Matcher {
    constructor(patterns) {
        // For each input pattern, generate a Minimatch object. Discard
        // any that have an empty pattern.
        const allPatterns = (patterns || [])
            .map((pattern) => new minimatch.Minimatch(pattern, STANDARD_OPTIONS))
            .filter((pattern) => !pattern.empty)
        this._positivePatterns = allPatterns.filter((pattern) => !pattern.negate)
        this._negativePatterns = allPatterns.filter((pattern) => pattern.negate)
    }

    /**
     * Return true if the path matches any of the given patterns.
     *
     * The patterns can include negations, so matching is done against all
     * the patterns. A match is true if a given path matches any pattern and
     * does not match any negating patterns.
     *
     * Because the matcher does not support empty patterns, an empty
     * path will never match.
     *
     * @param path {String} the path to be matched
     * @returns {boolean} true for a match, false if no match
     */
    matches(path) {
        if (path) {
            const positive = this._positivePatterns.some((pattern) => pattern.match(path))

            // A negative pattern.match returns true if the
            // path does NOT match it.
            const negative = this._negativePatterns.some((pattern) => !pattern.match(path))

            return positive && !negative
        }
        return false
    }

    /**
     * Returns a matching function suitable for use with
     * Array.filter, Array.some, etc
     */
    get filter() {
        return (path) => this.matches(path)
    }
}
