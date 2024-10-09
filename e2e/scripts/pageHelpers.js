const { expect } = require("@playwright/test");
const config = require("../config");

export const addProductToCart = async (page) => {
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
