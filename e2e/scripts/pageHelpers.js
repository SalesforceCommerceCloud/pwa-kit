const {expect} = require('@playwright/test')
const config = require('../config')
const {getCreditCardExpiry, runAccessibilityTest} = require('../scripts/utils.js')
/**
 * Note: As a best practice, we should await the network call and assert on the network response rather than waiting for pageLoadState()
 * to avoid race conditions from lock in pageLoadState being released before network call resolves.
 *
 * This is a best practice for tests that are dependent on the network call. Eg.: Shopper login, registration, etc.
 */

/**
 * Give an answer to the consent tracking form.
 *
 * Note: the consent tracking form hovers over some elements in the app. This can cause a test to fail.
 * Run this function after a page.goto to release the form from view.
 *
 * @param {Object} page - Object that represents a tab/window in the browser provided by playwright
 * @param {Boolean} dnt - Do Not Track value to answer the form. False to enable tracking, True to disable tracking.
 */
export const answerConsentTrackingForm = async (page, dnt = false) => {
    try {
        const consentFormVisible = await page.locator('text=Tracking Consent').isVisible().catch(() => false)
        if (!consentFormVisible) {
            return
        }

        const buttonText = dnt ? 'Decline' : 'Accept'
        await page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first().waitFor({ timeout: 3000 })
        
        // Find and click consent buttons (handles both mobile and desktop versions existing in the DOM)
        const clickSuccess = await page.evaluate((targetText) => {
            // Try aria-label first, then fallback to text content
            let buttons = Array.from(document.querySelectorAll(`button[aria-label="${targetText} tracking"]`))
            
            if (buttons.length === 0) {
                buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
                    btn.textContent && btn.textContent.trim().toLowerCase() === targetText.toLowerCase()
                )
            }
            
            let clickedCount = 0
            buttons.forEach((button) => {
                // Only click visible buttons
                if (button.offsetParent !== null) {
                    button.click()
                    clickedCount++
                }
            })
            
            return clickedCount
        }, buttonText)

        // after clicking an answering button, the tracking consent should not stay in the DOM
        if (clickSuccess > 0) {
            await page.waitForTimeout(2000)
            await page.locator('text=Tracking Consent').isHidden({ timeout: 5000 }).catch(() => {})
        }
    } catch (error) {
        // Silently continue - consent form handling should not break tests
    }
}

/**
 * Navigates to the `Cotton Turtleneck Sweater` PDP (Product Detail Page) on mobile
 * with the black variant selected
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const navigateToPDPMobile = async ({page}) => {
    // Home page
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    await page.getByLabel('Menu', {exact: true}).click()

    // SSR nav loads top level categories as direct links so we wait till all sub-categories load in the accordion
    const categoryAccordion = page.locator(
        "#category-nav .chakra-accordion__button svg+:text('Womens')"
    )
    await categoryAccordion.waitFor()

    await page.getByRole('button', {name: 'Womens'}).click()

    const clothingNav = page.getByRole('button', {name: 'Clothing'})

    await clothingNav.waitFor()

    await clothingNav.click()

    const topsLink = page.getByLabel('Womens').getByRole('link', {name: 'Tops'})
    await topsLink.click()
    // Wait for the nav menu to close first
    await topsLink.waitFor({state: 'hidden'})

    await expect(page.getByRole('heading', {name: 'Tops'})).toBeVisible()

    // PLP
    const productTile = page.getByRole('link', {
        name: /Cotton Turtleneck Sweater/i
    })
    await productTile.scrollIntoViewIfNeeded()
    // selecting swatch
    const productTileImg = productTile.locator('img')
    await productTileImg.waitFor({state: 'visible'})
    const initialSrc = await productTileImg.getAttribute('src')
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible()

    await productTile.getByLabel(/Black/, {exact: true}).click()
    // Make sure the image src has changed
    await expect(async () => {
        const newSrc = await productTileImg.getAttribute('src')
        expect(newSrc).not.toBe(initialSrc)
    }).toPass()
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible()
    await productTile.click()
}

/**
 * Navigates to the `Cotton Turtleneck Sweater` PDP (Product Detail Page) on Desktop
 * with the black variant selected.
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const navigateToPDPDesktop = async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    await page.getByRole('link', {name: 'Womens'}).hover()
    const topsNav = await page.getByRole('link', {name: 'Tops', exact: true})
    await expect(topsNav).toBeVisible()

    await topsNav.click()

    // PLP
    const productTile = page.getByRole('link', {
        name: /Cotton Turtleneck Sweater/i
    })
    // selecting swatch
    const productTileImg = productTile.locator('img')
    await productTileImg.waitFor({state: 'visible'})
    const initialSrc = await productTileImg.getAttribute('src')
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible()

    await productTile.getByLabel(/Black/, {exact: true}).hover()
    // Make sure the image src has changed
    await expect(async () => {
        const newSrc = await productTileImg.getAttribute('src')
        expect(newSrc).not.toBe(initialSrc)
    }).toPass()
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible()

    await productTile.click()
}

/**
 * Navigates to the `Cotton Turtleneck Sweater` PDP (Product Detail Page) on Desktop
 * with the black variant selected.
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const navigateToPDPDesktopSocial = async ({
    page,
    productName,
    productColor,
    productPrice
}) => {
    await page.goto(config.SOCIAL_LOGIN_RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)

    await page.getByRole('link', {name: 'Womens'}).hover()
    const topsNav = await page.getByRole('link', {name: 'Tops', exact: true})
    await expect(topsNav).toBeVisible()

    await topsNav.click()

    // PLP
    const productTile = page.getByRole('link', {
        name: RegExp(productName, 'i')
    })
    // selecting swatch
    const productTileImg = productTile.locator('img')
    await productTileImg.waitFor({state: 'visible'})
    await expect(productTile.getByText(RegExp(`From \\${productPrice}`, 'i'))).toBeVisible()

    await productTile.getByLabel(RegExp(productColor, 'i'), {exact: true}).hover()
    await productTile.click()
}

/**
 * Adds the `Cotton Turtleneck Sweater` product to the cart with the variant:
 * Color: Black
 * Size: L
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 * @param {Boolean} options.isMobile - Flag to indicate if device type is mobile or not, defaulted to false
 */
export const addProductToCart = async ({page, isMobile = false}) => {
    // Navigate to Cotton Turtleneck Sweater with Black color variant selected
    if (isMobile) {
        await navigateToPDPMobile({page})
    } else {
        await navigateToPDPDesktop({page})
    }

    // PDP
    await expect(page.getByRole('heading', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()
    await page.getByRole('radio', {name: 'L', exact: true}).click()

    await page.locator("button[data-testid='quantity-increment']").click()

    // Selected Size and Color texts are broken into multiple elements on the page.
    // So we need to look at the page URL to verify selected variants
    const updatedPageURL = await page.url()
    const params = updatedPageURL.split('?')[1]
    expect(params).toMatch(/size=9LG/i)
    expect(params).toMatch(/color=JJ169XX/i)
    await page.getByRole('button', {name: /Add to Cart/i}).click()

    const addedToCartModal = page.getByText(/2 items added to cart/i)

    await addedToCartModal.waitFor()

    await page.getByLabel('Close').click()
}

/**
 * Registers a shopper with provided user credentials
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 * @param {Object} options.userCredentials - Object containing user credentials with the following properties:
 *      - firstName
 *      - lastName
 *      - email
 *      - password
 * @param {Boolean} options.isMobile - flag to indicate if device type is mobile or not, defaulted to false
 */
export const registerShopper = async ({page, userCredentials, isMobile = false}) => {
    // Create Account and Sign In
    await page.goto(config.RETAIL_APP_HOME + '/registration')
    await answerConsentTrackingForm(page)

    await page.waitForLoadState()

    // Skip registration if user is already logged in
    const initialUrl = page.url()
    if (initialUrl.includes('/account')) {
        return
    }

    const registrationFormHeading = page.getByText(/Let's get started!/i)
    try {
        await registrationFormHeading.waitFor({ timeout: 10000 })
    } catch (error) {
        // Check if user was redirected to account page during wait
        const urlAfterWait = page.url()
        if (urlAfterWait.includes('/account')) {
            return
        }
        throw new Error(`Registration form not found. Current URL: ${urlAfterWait}`)
    }

    await page.locator('input#firstName').fill(userCredentials.firstName)
    await page.locator('input#lastName').fill(userCredentials.lastName)
    await page.locator('input#email').fill(userCredentials.email)
    await page.locator('input#password').fill(userCredentials.password)

    // Best Practice: await the network call and assert on the network response rather than waiting for pageLoadState()
    // to avoid race conditions from lock in pageLoadState being released before network call resolves
    const tokenResponsePromise = page.waitForResponse(
        '**/shopper/auth/v1/organizations/**/oauth2/token'
    )
    await page.getByRole('button', {name: /Create Account/i}).click()
    const tokenResponse = await tokenResponsePromise
    expect(tokenResponse.status()).toBe(200)

    await page.waitForURL(/.*\/account.*/, { timeout: 10000 })

    await expect(page.getByText(userCredentials.email)).toBeVisible()
}

/**
 * Validates that the `Cotton Turtleneck Sweater` product appears in the Order History page
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const validateOrderHistory = async ({page, a11y = {}}) => {
    const {checkA11y = false, snapShotName} = a11y
    await page.goto(config.RETAIL_APP_HOME + '/account/orders')
    await answerConsentTrackingForm(page)

    await expect(page.getByRole('heading', {name: /Order History/i})).toBeVisible()

    await page.getByRole('link', {name: 'View details'}).click()

    await expect(page.getByRole('heading', {name: /Order Details/i})).toBeVisible()
    await expect(page.getByRole('heading', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()
    await expect(page.getByText(/Color: Black/i)).toBeVisible()
    await expect(page.getByText(/Size: L/i)).toBeVisible()
    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'order-history-a11y-violations.json'])
    }
}

/**
 * Validates that the `Cotton Turtleneck Sweater` product appears in the Wishlist page
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const validateWishlist = async ({page, a11y = {}}) => {
    const {checkA11y = false, snapShotName} = a11y

    await page.goto(config.RETAIL_APP_HOME + '/account/wishlist')
    await answerConsentTrackingForm(page)

    await expect(page.getByRole('heading', {name: /Wishlist/i})).toBeVisible()

    await expect(page.getByRole('heading', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()
    await expect(page.getByText(/Color: Black/i)).toBeVisible()
    await expect(page.getByText(/Size: L/i)).toBeVisible()
    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'wishlist-violations.json'])
    }
}

/**
 * Attempts to log in a shopper with provided user credentials.
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 * @param {Object} options.userCredentials - Object containing user credentials with the following properties:
 *      - firstName
 *      - lastName
 *      - email
 *      - password
 *
 * @return {Boolean} - denotes whether or not login was successful
 */
export const loginShopper = async ({page, userCredentials}) => {
    try {
        await page.goto(config.RETAIL_APP_HOME + '/login')
        await answerConsentTrackingForm(page)

        await page.locator('input#email').fill(userCredentials.email)
        await page.locator('input#password').fill(userCredentials.password)

        const loginResponsePromise = page.waitForResponse(
            '**/shopper/auth/v1/organizations/**/oauth2/login'
        )
        const tokenResponsePromise = page.waitForResponse(
            '**/shopper/auth/v1/organizations/**/oauth2/token'
        )
        await page.getByRole('button', {name: /Sign In/i}).click()
        
        const loginResponse = await loginResponsePromise
        expect(loginResponse.status()).toBe(303) // Login returns a 303 redirect to /callback with authCode and usid
        
        const tokenResponse = await tokenResponsePromise
        expect(tokenResponse.status()).toBe(200)

        await page.waitForURL(/.*\/account.*/, { timeout: 10000 })

        await expect(page.getByText(userCredentials.email)).toBeVisible()
        return true
    } catch (error) {
        return false
    }
}

/**
 * Attempts to log in a shopper with provided user credentials.
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 * @return {Boolean} - denotes whether or not login was successful
 */
export const socialLoginShopper = async ({page}) => {
    try {
        await page.goto(config.SOCIAL_LOGIN_RETAIL_APP_HOME + '/login')

        await page.getByText(/Google/i).click()
        await expect(page.getByText(/Sign in with Google/i)).toBeVisible({timeout: 10000})
        await page.waitForSelector('input[type="email"]')

        // Fill in the email input
        await page.fill('input[type="email"]', config.PWA_E2E_USER_EMAIL)
        await page.click('#identifierNext')

        await page.waitForSelector('input[type="password"]')

        // Fill in the password input
        await page.fill('input[type="password"]', config.PWA_E2E_USER_PASSWORD)
        await page.click('#passwordNext')
        await page.waitForLoadState()

        await expect(page.getByRole('heading', {name: /Account Details/i})).toBeVisible({
            timeout: 20000
        })
        await expect(page.getByText(/e2e.pwa.kit@gmail.com/i)).toBeVisible()

        // Password card should be hidden for social login user
        await expect(page.getByRole('heading', {name: /Password/i})).toBeHidden()

        return true
    } catch {
        return false
    }
}

/**
 * Search for products by query string that takes you to the PLP
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 * @param {String} options.query - Product name other product related descriptors to search for
 * @param {Object} options.isMobile - Flag to indicate if device type is mobile or not, defaulted to false
 */
export const searchProduct = async ({page, query, isMobile = false}) => {
    await page.goto(config.RETAIL_APP_HOME)
    await answerConsentTrackingForm(page)
    // For accessibility reasons, we have two search bars
    // one for desktop and one for mobile depending on your device type
    const searchInputs = page.locator('input[aria-label="Search for products..."]')

    let searchInput = isMobile ? searchInputs.nth(1) : searchInputs.nth(0)
    await searchInput.fill(query)
    await searchInput.press('Enter')

    await page.waitForLoadState()
}

/**
 * Checkout products that are in the cart
 *
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 * @param {Object} options.userCredentials - Object containing user credentials with the following properties:
 *      - firstName
 *      - lastName
 *      - email
 *      - password
 */
export const checkoutProduct = async ({page, userCredentials, a11y = {checkA11y: false}}) => {
    const {checkA11y, snapShotName} = a11y
    await page.getByRole('link', {name: 'Proceed to Checkout'}).click()

    await expect(page.getByRole('heading', {name: /Contact Info/i})).toBeVisible()

    await page.locator('input#email').fill('test@gmail.com')
    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-0.json'])
    }
    await page.getByRole('button', {name: /Checkout as guest/i}).click()

    // Confirm the email input toggles to show edit button on clicking "Checkout as guest"
    const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']")

    await expect(step0Card.getByRole('button', {name: /Edit/i})).toBeVisible()

    await expect(page.getByRole('heading', {name: /Shipping Address/i})).toBeVisible()

    await page.locator('input#firstName').fill(userCredentials.firstName)
    await page.locator('input#lastName').fill(userCredentials.lastName)
    await page.locator('input#phone').fill(userCredentials.phone)
    await page.locator('input#address1').fill(userCredentials.address.street)
    await page.locator('input#city').fill(userCredentials.address.city)
    await page.locator('select#stateCode').selectOption(userCredentials.address.state)
    await page.locator('input#postalCode').fill(userCredentials.address.zipcode)
    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-1.json'])
    }
    await page.getByRole('button', {name: /Continue to Shipping Method/i}).click()

    // Confirm the shipping details form toggles to show edit button on clicking "Checkout as guest"
    const step1Card = page.locator("div[data-testid='sf-toggle-card-step-1']")

    await expect(step1Card.getByRole('button', {name: /Edit/i})).toBeVisible()
    await expect(page.getByRole('heading', {name: /Shipping & Gift Options/i})).toBeVisible()

    try {
        // sometimes the shipping & gifts section gets skipped
        // so there is no 'Continue to payment' button available
        const continueToPayment = page.getByRole('button', {
            name: /Continue to Payment/i
        })
        await expect(continueToPayment).toBeVisible({timeout: 2000})
        if (checkA11y) {
            await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-2.json'])
        }
        await continueToPayment.click()
    } catch {}

    await expect(page.getByRole('heading', {name: /Payment/i})).toBeVisible()
    const creditCardExpiry = getCreditCardExpiry()

    await page.locator('input#number').fill('4111111111111111')
    await page.locator('input#holder').fill('John Doe')
    await page.locator('input#expiry').fill(creditCardExpiry)
    await page.locator('input#securityCode').fill('213')
    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-3.json'])
    }
    await page.getByRole('button', {name: /Review Order/i}).click()

    page.getByRole('button', {name: /Place Order/i})
        .first()
        .click()

    // order confirmation
    const orderConfirmationHeading = page.getByRole('heading', {
        name: /Thank you for your order!/i
    })
    if (checkA11y) {
        await runAccessibilityTest(page, [
            snapShotName,
            'checkout-a11y-violations-step-4-order-confirmation.json'
        ])
    }
    await orderConfirmationHeading.waitFor()
}

export const registeredUserHappyPath = async ({page, registeredUserCredentials, a11y = {}}) => {
    const {checkA11y = false, snapShotName} = a11y
    // Since we're re-using the same account, we need to check if the user is already registered.
    // This ensures the tests are independent and not dependent on the order they are run in.
    const isLoggedIn = await loginShopper({
        page,
        userCredentials: registeredUserCredentials
    })

    if (!isLoggedIn) {
        await registerShopper({
            page,
            userCredentials: registeredUserCredentials
        })
    }
    await answerConsentTrackingForm(page)
    await page.waitForLoadState()
    
    // Verify we're on account page and user is logged in
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/account/)
    await expect(page.getByText(registeredUserCredentials.email)).toBeVisible()

    // Shop for items as registered user
    await addProductToCart({page})

    // cart
    await page.getByLabel(/My cart/i).click()

    await expect(page.getByRole('link', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()

    await page.getByRole('link', {name: 'Proceed to Checkout'}).click()

    // Confirm the email input toggles to show sign out button on clicking "Checkout as guest"
    const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']")

    await expect(step0Card.getByRole('button', {name: /Sign Out/i})).toBeVisible()

    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-0.json'])
    }
    await expect(page.getByRole('heading', {name: /Shipping Address/i})).toBeVisible()

    await page.locator('input#firstName').fill(registeredUserCredentials.firstName)
    await page.locator('input#lastName').fill(registeredUserCredentials.lastName)
    await page.locator('input#phone').fill(registeredUserCredentials.phone)
    await page.locator('input#address1').fill(registeredUserCredentials.address.street)
    await page.locator('input#city').fill(registeredUserCredentials.address.city)
    await page.locator('select#stateCode').selectOption(registeredUserCredentials.address.state)
    await page.locator('input#postalCode').fill(registeredUserCredentials.address.zipcode)

    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-1.json'])
    }
    await page.getByRole('button', {name: /Continue to Shipping Method/i}).click()

    // Confirm the shipping details form toggles to show edit button on clicking "Checkout as guest"
    const step1Card = page.locator("div[data-testid='sf-toggle-card-step-1']")

    await expect(step1Card.getByRole('button', {name: /Edit/i})).toBeVisible()

    await expect(page.getByRole('heading', {name: /Shipping & Gift Options/i})).toBeVisible()
    await page.waitForLoadState()
    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-2.json'])
    }

    const continueToPayment = page.getByRole('button', {
        name: /Continue to Payment/i
    })

    let hasShippingStep = false
    try {
        await expect(continueToPayment).toBeVisible({timeout: 2000})
        await continueToPayment.click()
        hasShippingStep = true
    } catch {
        // Shipping step was skipped, proceed directly to payment
    }

    // Verify step-2 edit button only if shipping step was present
    if (hasShippingStep) {
        const step2Card = page.locator("div[data-testid='sf-toggle-card-step-2']")
        await expect(step2Card.getByRole('button', {name: /Edit/i})).toBeVisible()
    }

    await expect(page.getByRole('heading', {name: /Payment/i})).toBeVisible()

    const creditCardExpiry = getCreditCardExpiry()

    await page.locator('input#number').fill('4111111111111111')
    await page.locator('input#holder').fill('John Doe')
    await page.locator('input#expiry').fill(creditCardExpiry)
    await page.locator('input#securityCode').fill('213')
    if (checkA11y) {
        await runAccessibilityTest(page, [snapShotName, 'checkout-a11y-violations-step-3.json'])
    }

    await page.getByRole('button', {name: /Review Order/i}).click()

    // Confirm the shipping options form toggles to show edit button on clicking "Checkout as guest"
    const step3Card = page.locator("div[data-testid='sf-toggle-card-step-3']")

    await expect(step3Card.getByRole('button', {name: /Edit/i})).toBeVisible()
    page.getByRole('button', {name: /Place Order/i})
        .first()
        .click()

    const orderConfirmationHeading = page.getByRole('heading', {
        name: /Thank you for your order!/i
    })

    await orderConfirmationHeading.waitFor()

    await expect(page.getByRole('heading', {name: /Order Summary/i})).toBeVisible()
    await expect(page.getByText(/2 Items/i)).toBeVisible()
    await expect(page.getByRole('link', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()
    if (checkA11y) {
        await runAccessibilityTest(page, [
            'registered',
            'checkout-a11y-violations-step-4-order-confirmation.json'
        ])
    }
    // order history
    await validateOrderHistory({page, a11y})
}

/**
 * Executes the wishlist flow for a registered user.
 * 
 * Includes robust authentication handling with fallback mechanisms.
 *
 * @param {Object} options.page - Playwright page object representing a browser tab/window
 * @param {Object} options.registeredUserCredentials - User credentials for authentication
 * @param {Object} options.a11y - Accessibility testing configuration (optional)
 */
export const wishlistFlow = async ({page, registeredUserCredentials, a11y = {}}) => {
    const isLoggedIn = await loginShopper({
        page,
        userCredentials: registeredUserCredentials
    })

    if (!isLoggedIn) {
        try {
            await registerShopper({
                page,
                userCredentials: registeredUserCredentials
            })
        } catch (error) {
            // If registration fails attempt to log in
            const secondLoginAttempt = await loginShopper({
                page,
                userCredentials: registeredUserCredentials
            })
            if (!secondLoginAttempt) {
                throw new Error('Authentication failed: Both login and registration unsuccessful')
            }
        }
    }

    // The consent form does not stick after registration
    await answerConsentTrackingForm(page)
    await page.waitForLoadState()

    const currentUrl = page.url()
    if (!currentUrl.includes('/account')) {
        await page.goto(config.RETAIL_APP_HOME + '/account')
        await page.waitForLoadState()
    }

    // Navigate to PDP
    await navigateToPDPDesktop({page})

    // add product to wishlist
    await expect(page.getByRole('heading', {name: /Cotton Turtleneck Sweater/i})).toBeVisible()

    await page.getByRole('radio', {name: 'L', exact: true}).click()
    await page.getByRole('button', {name: /Add to Wishlist/i}).click()

    // wishlist
    await validateWishlist({page, a11y})
}
