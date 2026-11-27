/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {expect, test: base} = require('@playwright/test')
const path = require('node:path')
const asset = require('./asset.json')

const widget = (page) => page.locator('inline-agent-widget')
const drawer = (page) => page.getByRole('complementary', {name: 'Controlled Shopper Agent drawer'})
const question = 'Is this waterproof?'
const test = base.extend({
    page: async ({page}, use) => {
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await use(page)
        expect(errors, 'Uncaught fixture errors').toEqual([])
    }
})

test.beforeEach(async ({context, baseURL}) => {
    await context.route('**/*', (route) => {
        const url = route.request().url()
        if (url === asset.url) {
            return route.fulfill({
                path: path.join(__dirname, '.cache/inline-agent-widget.umd.js'),
                contentType: 'application/javascript'
            })
        }
        return new URL(url).origin === baseURL ? route.continue() : route.abort()
    })
})

for (const config of ['disabled', 'omitted']) {
    test(`${config} configuration leaves PDP actions available`, async ({page}) => {
        await page.goto(`/product/a?config=${config}`)
        await expect(page.getByTestId('pdp-fixture-ready')).toBeVisible()
        await expect(page.getByRole('button', {name: 'Add to Cart'})).toBeVisible()
        await expect(page.getByRole('heading', {name: 'Trail Jacket'})).toBeVisible()
        await expect(widget(page)).toHaveCount(0)
        await expect(page.locator(`script[src="${asset.url}"]`)).toHaveCount(0)
    })
}

test('real UMD mounts in the action area and survives a PDP change', async ({page}) => {
    await test.step('Load the widget through the PWA component and Helmet', async () => {
        await page.goto('/product/a')
        const actions = page.getByRole('region', {name: 'Product actions'})
        await expect(actions.locator('inline-agent-widget')).toHaveCount(1)
        await expect(widget(page).getByRole('button', {name: question})).toBeVisible()
        await expect(page.locator(`script[src="${asset.url}"]`)).toHaveCount(1)
        await expect(
            page.locator(`link[rel="preconnect"][href="${new URL(asset.url).origin}"]`)
        ).toHaveCount(1)
        await widget(page).evaluate((element) =>
            element.setAttribute('data-browser-fixture', 'original')
        )
    })
    await test.step('Change to another PDP and retain the widget instance and script', async () => {
        await page.getByRole('button', {name: 'Go to Hiking Boots'}).click()
        await expect(widget(page)).toHaveAttribute('data-browser-fixture', 'original')
        await expect(widget(page)).toHaveAttribute('product-name', 'Hiking Boots')
        await expect(widget(page).getByRole('button', {name: 'Are these insulated?'})).toBeVisible()
        await expect(widget(page).getByRole('button', {name: question})).toHaveCount(0)
        await expect(page.locator(`script[src="${asset.url}"]`)).toHaveCount(1)
    })
})

test('starter pills open the drawer and deliver each question with the current product context', async ({
    page
}) => {
    await page.goto('/product/a')
    await test.step('Click a pill and check the drawer and delivery', async () => {
        await widget(page).getByRole('button', {name: question}).click()
        await expect(drawer(page).getByText(question, {exact: true})).toBeVisible()
    })
    await test.step('Navigate and check that the next question carries the new PDP context', async () => {
        await page.getByRole('button', {name: 'Go to Hiking Boots'}).click()
        await widget(page).getByRole('button', {name: 'Are these insulated?'}).click()
        await expect(drawer(page).getByText('Are these insulated?', {exact: true})).toBeVisible()
        expect(await page.evaluate(() => window.fixtureDrawer)).toEqual({
            opens: 2,
            contexts: [
                {type: 'pdp', id: 'a'},
                {type: 'pdp', id: 'b'}
            ],
            sends: [question, 'Are these insulated?'],
            fallbackSends: 0
        })
    })
})

test('a failed handoff preserves the question and waits for an explicit retry', async ({page}) => {
    await page.goto('/product/a?rejectFirst')
    await widget(page).getByRole('button', {name: question}).click()
    const error = page.getByRole('alert')
    await expect(error.getByText(question, {exact: true})).toBeVisible()
    expect(await page.evaluate(() => window.fixtureDrawer.sends)).toEqual([question])
    expect(await page.evaluate(() => window.fixtureDrawer.fallbackSends)).toBe(0)
    await error.getByRole('button', {name: 'Try again'}).click()
    await expect(drawer(page).getByText(question, {exact: true})).toBeVisible()
    await expect(error).toHaveCount(0)
    expect(await page.evaluate(() => window.fixtureDrawer.sends)).toEqual([question, question])
})

test('managed page context synchronizes once per PDP before a typed question', async ({page}) => {
    await page.goto('/product/a?managedContext')
    await expect(widget(page).getByRole('button', {name: question})).toBeVisible()
    await page.getByRole('button', {name: 'Go to Hiking Boots'}).click()
    const input = widget(page).getByRole('textbox', {name: 'Ask a question'})
    await input.fill('Can I wear these in snow?')
    await input.press('Enter')
    await expect(drawer(page).getByText('Can I wear these in snow?', {exact: true})).toBeVisible()
    expect(await page.evaluate(() => window.fixtureDrawer)).toEqual({
        opens: 1,
        contexts: [
            {type: 'pdp', id: 'a', name: 'Trail Jacket'},
            {type: 'pdp', id: 'b', name: 'Hiking Boots'}
        ],
        sends: ['Can I wear these in snow?'],
        fallbackSends: 0
    })
})
