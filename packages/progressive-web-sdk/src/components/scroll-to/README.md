```js static
// JS import
import ScrollTo from 'progressive-web-sdk/dist/components/scroll-to'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/scroll-to/base';
```


## Example Usage

*Scroll to the top of the page (target height of 0) with custom duration*

```jsx
<ScrollTo target={0} duration={200}>
    Go to the top of the page!
</ScrollTo>
```

*Scroll to Button component*

```jsx
<ScrollTo target="#Button">
    Go to the Button component
</ScrollTo>
```


*Jump to Icon component (duration of 0)*

```jsx
<ScrollTo target=".pw-icon" duration={0}>
    Jump to Icon component
</ScrollTo>
```


**Button components for testing**

```jsx
<div>
    <Button
        className="u-bg-color-neutral-30"
        id="Button"
        text="test"
    />
</div>
```

**Icon components for testing**

```jsx
<div>
    <Icon name="star" />
</div>
```
