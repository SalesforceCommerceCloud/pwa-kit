```js static
// JS import
import {HeaderBar, HeaderBarActions, HeaderBarTitle} from 'progressive-web-sdk/dist/components/header-bar'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/header-bar/base';
```


## Example Usage

```jsx
    <HeaderBar>
        <HeaderBarActions>
            Menu
        </HeaderBarActions>

        <HeaderBarActions>
            Search
        </HeaderBarActions>

        <HeaderBarTitle>
            Logo
        </HeaderBarTitle>

        <HeaderBarActions>
            Stores
        </HeaderBarActions>

        <HeaderBarActions>
            Cart
        </HeaderBarActions>
    </HeaderBar>
```


## Example With Buttons and Icons for Actions and Image for Title

```jsx
<HeaderBar>
    <HeaderBarActions>
        <Button className="pw--blank u-padding-sm">
            <IconLabel iconName="menu" label="Menu" />
        </Button>
    </HeaderBarActions>

    <HeaderBarActions>
        <Button className="pw--blank u-padding-sm">
            <IconLabel iconName="search" label="Search" />
        </Button>
    </HeaderBarActions>

    <HeaderBarTitle href="http://www.mobify.com">
        <img src="https://www.mobify.com/wp-content/uploads/logo-mobify-white.png" className="u-width-1of2" alt="Mobify Logo" height="28" />
    </HeaderBarTitle>

    <HeaderBarActions>
        <Button className="pw--blank u-padding-sm">
            <IconLabel iconName="location" label="Stores" />
        </Button>
    </HeaderBarActions>

    <HeaderBarActions>
        <Button className="pw--blank u-padding-sm">
            <IconLabel iconName="cart" label="Cart" />
        </Button>
    </HeaderBarActions>
</HeaderBar>
```


## Example With Static Title

```jsx
<HeaderBar>
    <HeaderBarTitle className="u-h4">
        Static title
    </HeaderBarTitle>

    <HeaderBarActions>
        <Button className="pw--secondary" icon="close" title="Close" />
    </HeaderBarActions>
</HeaderBar>
```


## Example With Link Title

```jsx
<HeaderBar>
    <HeaderBarTitle className="u-h4" href="http://www.mobify.com">
        Title link
    </HeaderBarTitle>

    <HeaderBarActions>
        <Button className="pw--secondary" icon="close" title="Close" />
    </HeaderBarActions>
</HeaderBar>
```


## Example of Custom Content in Title

```jsx
<HeaderBar>
    <HeaderBarTitle className="u-h4">
        <div className="u-flexbox u-align-center u-width-full">
            <Link href="http://www.mobify.com" className="u-flex">
                <img className="u-align-middle u-width-1of2" src="https://www.mobify.com/wp-content/uploads/logo-mobify-white.png" alt="Mobify Logo" height="28" />
            </Link>

            <div className="u-flex-none">
                <span className="u-align-middle">Secure Checkout</span>
                <Icon className="u-margin-start u-align-middle" name="lock" size="medium" />
            </div>
        </div>
    </HeaderBarTitle>
</HeaderBar>
```


## Example of Dialog HeaderBar

```jsx
<HeaderBar className="pw--dialog">
    <HeaderBarTitle className="u-h5">
        Dialog title
    </HeaderBarTitle>

    <HeaderBarActions>
        <Button className="pw--blank u-link-color" icon="close" title="Close" />
    </HeaderBarActions>
</HeaderBar>
```
