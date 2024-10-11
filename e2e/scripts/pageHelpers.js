const { expect } = require("@playwright/test");
const config = require("../config");
const { getCreditCardExpiry } = require("../scripts/utils.js")

/**
 * Navigates to the `Cotton Turtleneck Sweater` PDP (Product Detail Page) on mobile 
 * with the black variant selected
 * 
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const navigateToPDPMobile = async ({page}) => {
    // Home page
    await page.goto(config.RETAIL_APP_HOME);

    await page.getByLabel("Menu", { exact: true }).click();

    // SSR nav loads top level categories as direct links so we wait till all sub-categories load in the accordion
    const categoryAccordion = page.locator(
        "#category-nav .chakra-accordion__button svg+:text('Womens')"
    );
    await categoryAccordion.waitFor();

    await page.getByRole("button", { name: "Womens" }).click();

    const clothingNav = page.getByRole("button", { name: "Clothing" });

    await clothingNav.waitFor();

    await clothingNav.click();

    const topsLink = page.getByLabel('Womens').getByRole("link", { name: "Tops" });
    await topsLink.click();
    // Wait for the nav menu to close first
    await topsLink.waitFor({state: 'hidden'})

    await expect(page.getByRole("heading", { name: "Tops" })).toBeVisible();

    // PLP
    const productTile = page.getByRole("link", {
        name: /Cotton Turtleneck Sweater/i,
    });
    await productTile.scrollIntoViewIfNeeded()
    // selecting swatch
    const productTileImg = productTile.locator("img");
    await productTileImg.waitFor({state: 'visible'})
    const initialSrc = await productTileImg.getAttribute("src");
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible();

    await productTile.getByLabel(/Black/, { exact: true }).click();
    // Make sure the image src has changed
    await expect(async () => {
        const newSrc = await productTileImg.getAttribute("src")
        expect(newSrc).not.toBe(initialSrc)
    }).toPass()
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible();
    await productTile.click();
}

/**
 * Navigates to the `Cotton Turtleneck Sweater` PDP (Product Detail Page) on Desktop 
 * with the black variant selected.
 * 
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const navigateToPDPDesktop = async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME);

    await page.getByRole("link", { name: "Womens" }).hover();
    const topsNav = await page.getByRole("link", { name: "Tops", exact: true });
    await expect(topsNav).toBeVisible();
  
    await topsNav.click();

    // PLP
    const productTile = page.getByRole("link", {
      name: /Cotton Turtleneck Sweater/i,
    });
    // selecting swatch
    const productTileImg = productTile.locator("img");
    await productTileImg.waitFor({state: 'visible'})
    const initialSrc = await productTileImg.getAttribute("src");
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible();
  
    await productTile.getByLabel(/Black/, { exact: true }).hover();
    // Make sure the image src has changed
    await expect(async () => {
      const newSrc = await productTileImg.getAttribute("src")
      expect(newSrc).not.toBe(initialSrc)
    }).toPass()
    await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible();
    await productTile.click();
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
    if(isMobile) {
        await navigateToPDPMobile({page})
    } else {
        await navigateToPDPDesktop({page})
    }
  
    // PDP
    await expect(
      page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
    ).toBeVisible();
    await page.getByRole("radio", { name: "L", exact: true }).click();
  
    await page.locator("button[data-testid='quantity-increment']").click();
  
    // Selected Size and Color texts are broken into multiple elements on the page.
    // So we need to look at the page URL to verify selected variants
    const updatedPageURL = await page.url();
    const params = updatedPageURL.split("?")[1];
    expect(params).toMatch(/size=9LG/i);
    expect(params).toMatch(/color=JJ169XX/i);
    await page.getByRole("button", { name: /Add to Cart/i }).click();
  
    const addedToCartModal = page.getByText(/2 items added to cart/i);
  
    await addedToCartModal.waitFor();

    await page.getByLabel("Close").click();
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
    await page.goto(config.RETAIL_APP_HOME + "/registration");

    await page.waitForLoadState();

    const registrationFormHeading = page.getByText(/Let's get started!/i);
    await registrationFormHeading.waitFor();

    await page
        .locator("input#firstName")
        .fill(userCredentials.firstName);
    await page
        .locator("input#lastName")
        .fill(userCredentials.lastName);
    await page.locator("input#email").fill(userCredentials.email);
    await page
        .locator("input#password")
        .fill(userCredentials.password);

    await page.getByRole("button", { name: /Create Account/i }).click();

    await expect(
        page.getByRole("heading", { name: /Account Details/i })
    ).toBeVisible();

    if(!isMobile) {
        await expect(
            page.getByRole("heading", { name: /My Account/i })
        ).toBeVisible();
    }

    await expect(page.getByText(/Email/i)).toBeVisible();
    await expect(page.getByText(userCredentials.email)).toBeVisible();
}

/**
 * Validates that the `Cotton Turtleneck Sweater` product appears in the Order History page
 * 
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const validateOrderHistory = async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME + "/account/orders");
    await expect(
      page.getByRole("heading", { name: /Order History/i })
    ).toBeVisible();
  
    await page.getByRole('link', { name: 'View details' }).click();
  
    await expect(
      page.getByRole("heading", { name: /Order Details/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
    ).toBeVisible();
    await expect(page.getByText(/Color: Black/i)).toBeVisible();
    await expect(page.getByText(/Size: L/i)).toBeVisible();
}

/**
 * Validates that the `Cotton Turtleneck Sweater` product appears in the Wishlist page
 * 
 * @param {Object} options.page - Object that represents a tab/window in the browser provided by playwright
 */
export const validateWishlist = async ({page}) => {
    await page.goto(config.RETAIL_APP_HOME + "/account/wishlist");

    await expect(
      page.getByRole("heading", { name: /Wishlist/i })
    ).toBeVisible();
  
    await expect(
      page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
    ).toBeVisible();
    await expect(page.getByText(/Color: Black/i)).toBeVisible()
    await expect(page.getByText(/Size: L/i)).toBeVisible()
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
        await page.goto(config.RETAIL_APP_HOME + "/login");
        await page.locator("input#email").fill(userCredentials.email);
        await page
            .locator("input#password")
            .fill(userCredentials.password);
        await page.getByRole("button", { name: /Sign In/i }).click();
    
        await page.waitForLoadState();
    
        // redirected to Account Details page after logging in
        await expect(
          page.getByRole("heading", { name: /Account Details/i })
        ).toBeVisible({ timeout: 2000 });
        return true;
    } catch {
        return false;
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
    await page.goto(config.RETAIL_APP_HOME);

    // For accessibility reasons, we have two search bars
    // one for desktop and one for mobile depending on your device type
    const searchInputs = page.locator('input[aria-label="Search for products..."]');

    let searchInput = isMobile ? searchInputs.nth(1) : searchInputs.nth(0);
    await searchInput.fill(query); 
    await searchInput.press('Enter');

    await page.waitForLoadState();
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
export const checkoutProduct = async ({ page, userCredentials }) => {
    await page.getByRole("link", { name: "Proceed to Checkout" }).click();
    
    await expect(
        page.getByRole("heading", { name: /Contact Info/i })
    ).toBeVisible();

    await page.locator("input#email").fill("test@gmail.com");

    await page.getByRole("button", { name: /Checkout as guest/i }).click();

    // Confirm the email input toggles to show edit button on clicking "Checkout as guest"
    const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']");

    await expect(step0Card.getByRole("button", { name: /Edit/i })).toBeVisible();

    await expect(
        page.getByRole("heading", { name: /Shipping Address/i })
    ).toBeVisible();

    await page.locator("input#firstName").fill(userCredentials.firstName);
    await page.locator("input#lastName").fill(userCredentials.lastName);
    await page.locator("input#phone").fill(userCredentials.phone);
    await page
        .locator("input#address1")
        .fill(userCredentials.address.street);
    await page.locator("input#city").fill(userCredentials.address.city);
    await page
        .locator("select#stateCode")
        .selectOption(userCredentials.address.state);
    await page
        .locator("input#postalCode")
        .fill(userCredentials.address.zipcode);

    await page
        .getByRole("button", { name: /Continue to Shipping Method/i })
        .click();

    // Confirm the shipping details form toggles to show edit button on clicking "Checkout as guest"
    const step1Card = page.locator("div[data-testid='sf-toggle-card-step-1']");

    await expect(step1Card.getByRole("button", { name: /Edit/i })).toBeVisible();

    await expect(
        page.getByRole("heading", { name: /Shipping & Gift Options/i })
    ).toBeVisible();

    try {
        // sometimes the shipping & gifts section gets skipped
        // so there is no 'Continue to payment' button available
        const continueToPayment = page.getByRole("button", {
            name: /Continue to Payment/i
        });
        await expect(continueToPayment).toBeVisible({ timeout: 2000 });
        await continueToPayment.click();
    } catch {

    }

    await expect(page.getByRole("heading", { name: /Payment/i })).toBeVisible();
    const creditCardExpiry = getCreditCardExpiry();

    await page.locator("input#number").fill("4111111111111111");
    await page.locator("input#holder").fill("John Doe");
    await page.locator("input#expiry").fill(creditCardExpiry);
    await page.locator("input#securityCode").fill("213");

    await page.getByRole("button", { name: /Review Order/i }).click();

    page
        .getByRole("button", { name: /Place Order/i })
        .first()
        .click();

    // order confirmation
    const orderConfirmationHeading = page.getByRole("heading", {
        name: /Thank you for your order!/i,
    });
    await orderConfirmationHeading.waitFor();
}
