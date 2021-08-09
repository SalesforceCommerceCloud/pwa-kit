```js static
// JS import
import SkipLinks from 'progressive-web-sdk/dist/components/skip-links'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/skip-links/base';
```


## `target`

The `target` prop is an ID in the form of a string that refers to a DOM element on the current page and is used in an anchor tag's `href` to "jump" to that DOM element. For example, `#app-navigation` or `#app-footer` in the example below.

This target should indeed point to an element that exists on the page. If there is no element on the page, then that could result in an unexpected and confusing user experience for non-visual users, such as screen reader users.


## `label`

The `label` prop is a text string that will display inside each individual anchor in the SkipLinks. This text should be human readable so any user agents can easily use it for simple navigation.

## Example Usage

```jsx
<div>
    <p>Press "Tab" until you see a link appear below this text!</p>
    <SkipLinks items={[
        {
            target: '#app-main',
            label: 'Skip to content',
        }, {
            target: '#header-navigation',
            label: 'Skip to main navigation',
        }, {
            target: '#app-footer',
            label: 'Skip to footer'
        }
    ]} />
</div>
```
