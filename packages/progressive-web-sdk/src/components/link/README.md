```js static
// JS import
import Link from 'progressive-web-sdk/dist/components/link'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/link/link';
```

## Example Usage

*With child text*

```jsx
<Link href="http://mobify.com/">Mobify</Link>
```

*With child elements*

```jsx
<Link href="http://mobify.com/">
    <i>MOBIFY!</i>
</Link>
```

*With prop text*

```jsx
<Link href="http://google.com/" text="Go to Google" />
```

*With no href*

```jsx
<Link text="No URL provided" />
```

*With an onClick handler*

```jsx
<Link text="Click me!" onClick={(e) => {
    alert('Clicked'), e.preventDefault()
}} />
```

*With hover (onEnter and onLeave) handlers*

```jsx

initialState = {
    isHovering: false
};

<Link
    text={state.isHovering ? 'Hovering! 🐭' : 'Hover Me!'} 
    onMouseEnter={() => setState({isHovering: true})}
    onMouseLeave={() => setState({isHovering: false})}
/>
```
