```js static
// JS import
import Button from 'progressive-web-sdk/dist/components/button'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/button/base';
```


## Example Usage

```jsx
<Button>Default Button (no styles)</Button>
```

## Button Modifiers

*Primary*

```jsx
<Button className="pw--primary">Blank Button</Button>
```

*Secondary*

```jsx
<Button className="pw--secondary">Secondary Button</Button>
```

*Tertiary*

```jsx
<Button className="pw--tertiary">Tertiary Button</Button>
```

*Link style button*

```jsx
<div>
    Hello <Button className="pw--link">Link style button</Button>
</div>
```

## Example of Disabled Button

```jsx
<div>
    <div className="u-width-full u-margin-bottom">
        <Button disabled>Disabled Default Button</Button>
    </div>

    <div className="u-width-full u-margin-bottom">
        <Button disabled className="pw--primary">Disabled Primary Button</Button>
    </div>

    <div className="u-width-full u-margin-bottom">
        <Button disabled className="pw--secondary">Disabled Secondary Button</Button>
    </div>

    <div className="u-width-full">
        <Button disabled className="pw--tertiary">Disabled Tertiary Button</Button>
    </div>
</div>
```

## Other Button Usages

*`type="submit"`*

```jsx
<Button type="submit" className="pw--primary">Submit Type Button</Button>
```

*Anchor Type (has `href="#"`)*

```jsx
<div>
    <div className="u-margin-bottom">
        <Button href="#!/Button">Default Anchor Type Button</Button>
    </div>

    <div className="u-margin-bottom-lg">
        <Button href="#!/Button" className="pw--primary">Primary Anchor Type Button</Button>
    </div>

    <div className="u-margin-bottom">
        <Button href="#!/Button" className="pw--link">Link Anchor Type Button</Button>
    </div>
</div>
```

*Icon, with invisible (yet accessible) text*

```jsx
<Button icon="cart" title="Icon Button with hidden, but accessible text" className="pw--primary"></Button>
```

*Icon, with visible text*

```jsx
<Button icon="cart" title="Icon Button with visible text" showIconText className="pw--primary"></Button>
```

*Icon, with visible text AND invisible (yet accessible) text*

```jsx
<Button icon="cart" title="Hidden text!" className="pw--primary">Icon Button with hidden, but accessible text, and normal text</Button>
```

*Social buttons*

```jsx
<div>
    <Button className="pw--facebook" icon="social-facebook" title="Facebook" />
    <Button className="pw--twitter" icon="social-twitter" title="Twitter" />
    <Button className="pw--instagram" icon="social-instagram" title="Instagram" />
    <Button className="pw--pinterest" icon="social-pinterest" title="Pinterest" />
    <Button className="pw--youtube" icon="social-youtube" title="youtube" />
    <Button className="pw--google-plus" icon="social-google-plus" title="Google Plus" />
    <Button className="pw--yelp" icon="social-yelp" title="Yelp" />
</div>
```

*Set in progress state to a button*

```jsx
initialState = {
    addingToCart: false
};

const simulateAddingToCart = () => {
    // Adding to cart
    setState({addingToCart: true})

    // Re-enable button after item has been added to cart
    setTimeout(() => {
        setState({addingToCart: false})
    }, 2000)
};

<Button
    onClick={simulateAddingToCart}
    disabled={state.addingToCart}
    className="pw--primary"
>
    {state.addingToCart ?
        <InlineLoader text="Adding to cart" />
    :
        <span>Add to Cart</span>
    }
</Button>
```


*Add hover events to a button*

```jsx

initialState = {
    isHovering: false
};

<Button
    onMouseEnter={() => setState({isHovering: true})}
    onMouseLeave={() => setState({isHovering: false})}
    className="pw--primary"
>
    {state.isHovering ? 'Hover Me! 🐭' : 'Hover Me! 🐹'}
</Button>
```
