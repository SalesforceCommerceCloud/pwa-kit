/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
    This file exists because we need to have at least 1 .ts file in the source directory or TS lint will throw an error.
    We can remove this once we have an actual .ts file in this package.
 */
import {sum} from './sum'

/**
 * Returns the average of two numbers.
 *
 * @param x - The first input number
 * @param y - The second input number
 * @returns The arithmetic mean of `x` and `y`
 *
 * @example
 *```ts
 * const result = getAverage(10, 20)
 * ```
 *
 * @beta
 */
function getAverage(x: number, y: number): number {
    return sum(x, y) / 2.0
}

export {getAverage}
