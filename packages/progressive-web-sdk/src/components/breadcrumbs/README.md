```js static
// JS import
import Breadcrumbs from 'progressive-web-sdk/dist/components/breadcrumbs'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/breadcrumbs/base';
```

**Details of items prop**:
* text: (required) A string containing the text of the breadcrumb

* href: (optional) A string containing the url the breadcrumb should link to

* onClick: (optional) A method that fires when the breadcrumb item is clicked

* If neither href nor onClick is passed, the breadcrumb will be
 rendered without an anchor tag wrapping it.

## Example Usage

```jsx
<Breadcrumbs
    className="u-margin-bottom-lg"
    items={[
        {
            text: 'Home',
            href: 'http://www.mobify.com'
        },
        {
            text: 'Cat',
            href: 'http://www.mobify.com'
        },
        {
            text: 'Food'
        }
    ]}
/>
```

## Example With `onClick`

```jsx
<Breadcrumbs
    items={[
        {
            text: 'Back',
            onClick: () => alert('Clicked')
        }
    ]}
/>
```
