const { expect } = require("@playwright/test");
const config = require("../config");

// TODO: add documentation for all this

export const addProductToCartDesktop = async ({page}) => {
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
  
    // PDP
    await expect(
      page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
    ).toBeVisible();
    await page.getByRole("radio", { name: "L", exact: true }).click();
  
    await page.locator("button[data-testid='quantity-increment']").click();
  
    // // Selected Size and Color texts are broken into multiple elements on the page.
    // // So we need to look at the page URL to verify selected variants
    const updatedPageURL = await page.url();
    const params = updatedPageURL.split("?")[1];
    expect(params).toMatch(/size=9LG/i);
    expect(params).toMatch(/color=JJ169XX/i);
    await page.getByRole("button", { name: /Add to Cart/i }).click();
  
    const addedToCartModal = page.getByText(/2 items added to cart/i);
  
    await addedToCartModal.waitFor();

    await page.getByLabel("Close").click();
}

// TODO: potentially combine to have addProductToCart and accept isMobile flag
export const addProductToCartMobile = async ({page}) => {
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

    const topsLink = page.getByLabel('Womens').getByRole("link", { name: "Tops" })
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

export const registerShopper = async ({page, userCredentials, isMobile = false}) => {
    // Create Account and Sign In
    await page.goto(config.RETAIL_APP_HOME + "/registration");

    // TODO: see if there's a better way to do this
    await page.waitForTimeout(2000);

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
 * 
 * 
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
 * 
 * @returns boolean if log in was successful or not
 */
export const loginShopper = async ({page, userCredentials}) => {
    try {
        await page.goto(config.RETAIL_APP_HOME + "/login");
        await page.locator("input#email").fill(userCredentials.email);
        await page
            .locator("input#password")
            .fill(userCredentials.password);
        await page.getByRole("button", { name: /Sign In/i }).click();
    
        // TODO: see if there's a better way to do this
        await page.waitForTimeout(2000);
    
        // redirected to Account Details page after logging in
        await expect(
          page.getByRole("heading", { name: /Account Details/i })
        ).toBeVisible({ timeout: 2000 });
        return true
    } catch(error) {
        return false
    }
}