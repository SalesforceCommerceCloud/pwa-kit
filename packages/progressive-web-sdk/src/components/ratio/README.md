```js static
// JS import
import Ratio from 'progressive-web-sdk/dist/components/ratio'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/ratio/base';
```

## Example Usage

```jsx
<Ratio width="4" height="3">
    <img src="https://unsplash.it/400/300" alt="" />
</Ratio>
```


## Example With Aspect

Instead of using the `height` and `width` props, `aspect` can be used.

The value passed to `aspect` should be a string of two positive integers with a
colon ":" in between. For example `aspect="4:3"`.

```jsx
<Ratio aspect="4:3">
    <img src="https://unsplash.it/400/300" alt="" />
</Ratio>
```
