```js static
// JS import
import PasswordInput from 'progressive-web-sdk/dist/components/password-input'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/password-input/base';
```


## Example Usage

```jsx
<PasswordInput />
```

## Example Default Shown Password

```jsx
<PasswordInput showPassword />
```

## Example With `buttonIconName`

```jsx
<PasswordInput buttonIconName="review" />
```

## Example With Icon and No Text

```jsx
<PasswordInput hideButtonText buttonIconName="review" />
```

## Example With Custom Toggle Button

```jsx
<PasswordInput buttonIconName="lock" buttonIconSize="small" />
```

## Example With Custom A11y Labels

```jsx
<PasswordInput buttonIconName="review" buttonTextHide="Hide your password!" buttonTextShow="Show your password!" />
```
