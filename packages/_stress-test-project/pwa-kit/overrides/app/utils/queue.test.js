/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Queue from './queue'

test('Queue length', () => {
    const q = new Queue()
    q.enqueue(1)
    q.enqueue(2)
    expect(q.length).toEqual(2)
})

test('Queue isEmpty', () => {
    const q = new Queue()
    expect(q.isEmpty).toEqual(true)
    q.enqueue(1)
    expect(q.isEmpty).toEqual(false)
})

test('Queue FIFO', () => {
    const q = new Queue()
    q.enqueue(1)
    q.enqueue(2)
    expect(q.dequeue()).toEqual(1)
    expect(q.dequeue()).toEqual(2)
})

test('Queue async process', async () => {
    const q = new Queue()
    q.enqueue(1)

    return await q.process(async (item) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(item).toEqual(1)
    })
})
