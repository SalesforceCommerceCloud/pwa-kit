<div style="color:red; margin-bottom:20px;">
    This is a template made up of several components.
</div>

## Common Components

- [Banner](#!/Banner)
- [Stepper](#!/Stepper)
- [Accordion](#!/Accordion)
- [AccordionItem](#!/AccordionItem)
- [Ledger](#!/Ledger)
- [LedgerRow](#!/LedgerRow)
- [Button](#!/Button)
- [Field](#!/Field)
- [Select](#!/Select)
- [SkeletonBlock](#!/SkeletonBlock)
- [Sheet](#!/Sheet)


## UI Kit

![](../../assets/images/templates/checkout-cart/cart-uikit.png)


## Purpose

A listing of all items the user has saved, ready for purchase. Accessible from anywhere, this is considered the first step of the checkout process.

The cart is designed to hold items the user is interested in. It gives the user an accurate order total based on the value of those items, cost of shipping, taxes and any other fees that make up the total to pay.


## Appropriate Uses

- Accessible from any page on the website as the entry point to checkout.
- A way to compile items for the user to purchase all at once.
- As a list of ‘bookmarked’ items the user is interested in purchasing now or later.
- A way for the user to discover the cost of shipping the item(s) they are interested in.


## User Interactions

Note. Interactions can vary considerably depending on the customer's business logic.

### Enlarge product image
Tap on the thumbnail to see the image full screen

### Back to the product page
Tap on the product title to return to the PDP

### Adjust quantity
Increase or decrease the quantity of an item

### Edit product options
Reveals options to change product options such as size/color

### Save for later
Moves that item out of the cart into a separate list, such as a wishlist

### Remove
Deletes this item from the shopping cart

### Add promo code
Adjusts the order total to reflect applied promotion codes via entry of a valid code

### Calculate shipping & tax
Estimates shipping cost based on the user’s ZIP/Postal code

### Proceed to checkout
Begins the checkout process

### View help content
Expand or link to customer service content such as return policy

### Continue shopping
Links back to the homepage


## Usage Tips & Best Practices

- If a customer has content related to free shipping, this should be displayed at the top of the page using the banner component.
- The interaction “Save for later” should be followed by a modal dialogue letting the user know where they need to go to access this item later.
- If a customer’s business model for shipping and tax does not vary based on location, the default costs should be shown, without the need to estimate.
- If possible with the customer’s existing logic, product editing should be performed without leaving the cart, within a focussed modal.
- Users can sign in to their account from the cart. If possible this should be presented within a focussed modal.
- If a user successfully adds a promo code to the order, they should be given the appropriate dialogue to let them know this has been added to their order.
- If a customer offers multiple payment gateways, this should be presented to the user as a secondary option beneath the primary Proceed to checkout button, and should not visually overwhelm the user.

## Variations & States

### Shipping and tax displayed
After the location has been determined, the Calculate button is replaced with monetary values. User can change the location by tapping on the location text (opens estimate shipping modal)

### Empty state
The cart is accessible when there are no items to display. This page is made up of text content, with a supporting image/icon, and buttons to sign in or continue shopping (link to homepage)

### Loading state
Skeletal states should be used to mimic items in the cart when the page is loading

## Example Implementations

### Merlin's Potions

![](../../assets/images/templates/checkout-cart/cart-merlins.png)

### Lancome

![](../../assets/images/templates/checkout-cart/cart-lancome.png)
