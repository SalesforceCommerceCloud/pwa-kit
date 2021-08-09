# Design

## Related Components

- [HeaderBar](#!/HeaderBar)

## UI Kit

![](../../assets/images/components/search/search-uikit.png)

*Symbol Path: global -> SearchBar*

## Purpose

Search allows a user to retrieve a list of products related to a keyword or string of keywords.

## Appropriate Uses

- Typically 2 states; inline and focused. Inline appears globally within the page UI, focused appears in a modal view with the page UI behind in a disabled state.
- Typically accessible from the header bar, in the same place at all times throughout the user journey.
- As an alternate navigation choice in user flows where information isn't available (e.g. a 404 page may offer a search bar to the user within the page).
- On search results page as an option to search again.

## User Interactions

- If the search bar is hidden by default, tapping on an icon in the header bar will reveal and focus on the search bar.
- If the search bar is shown, tapping on the input field will focus the search field and open the native keyboard.
- Tapping on a suggested query in the autocomplete menu links to the search results page for that query.

## Usage Tips & Best Practices

- Auto-complete is a widely used pattern on the mobile well and should be considered when deciding to use inline or focused search.
- Displaying the number of products that will appear for a query in the autocomplete state has been known to confuse users. Hide this data until its accuracy is confirmed through testing with real data.
- A focused approach to the search component will work better for sites with suggested terms and suggested products as it dedicated the entire page UI to the possibility of this returning several results.
- A common approach is to open the search on the homepage and hide it on inner pages. This is bad practice as it implies a user will arrive at the site via the homepage, where realistically search engines and social media can deep link users onto any page.
- When the initial action of opening the search is triggered, the search bar should appear with the **native keyboard focused ready to type**. Having to tap into the field again will frustrate users.
- Usually to get the search keyboard to appear, all you need to is a type="search" attribute on your input. However, in iOS8 and up you'll need to have a wrapping form with an action attribute (does not matter what this is defined as). Code example can be found [here](http://stackoverflow.com/questions/4864167/show-search-button-in-iphone-ipad-safari-keyboard/26287843#26287843).
- Some operating systems will allow a native Clear button to be positioned at the end of the field. This is useful UI for users and should be enabled.
- If using a focused search, consider how a user will return to the non focused state. An x button to close the state may be confused with the native Clear action. Mobify recommends using a left arrow as a Back action.

## Accessibility

- Search needs to be accessible from every page, users expect this to be found in the header bar.
- Most native keyboards will have a search button, however it is recommended to include a submit button as part of the search component.
- Include placeholder text to better describe what the user can search for (e.g. search product name or ID)

## Example Implementations

### Lancome:

![](../../assets/images/components/search/search-lancome.png)

### Babista:

![](../../assets/images/components/search/search-babista.png)
