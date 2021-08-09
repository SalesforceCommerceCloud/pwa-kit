```js static
// JS import
import CardInput from 'progressive-web-sdk/dist/components/card-input'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/card-input/base';
```


## Example Usage

```jsx
initialState = {cc: "4111411141114111"};

<CardInput
    value={state.cc}
    defaultValue={state.cc}
    onChange={(value)=>{setState({cc: value})}}
    onBlur={()=> {}}
/>
```

## Example Usage With ccType

```jsx
initialState = {cc: "5500000000000004"};

<CardInput
    value={state.cc}
    defaultValue={state.cc}
    onChange={(value)=>{setState({cc: value})}}
    onBlur={()=> {}}
    ccType="mastercard"
/>
```

## Example Usage With Custom Card

To add support for custom cards, you will need to register a custom format to the `CardInput` component's `registerCustomFormat` class method.

The `registerCustomFormat` class method accepts a `data` object which is a dictionary of credit card names and their formatting rules. Each dictionary item's key dictates which credit card image will be shown, and each value is an object that must match the following format (see the code below for a examples of the `data` object):

| Key | Type | Value |
| --- | --- | --- |
| match | `string` | A regex pattern matched against the input of the CardInput component. <br /> A rule of `^123` will match an input of `1234567890` but not `0123456789` |
| format | `object` | Defines a series of formatting rules for the credit card input. <br /> The keys are integers which match against a credit card numbers's length. A key of `default` applies its rule to all other credit card lengths. <br /> The values are arrays of integers that indicate number groups in the credit card number. For example: `[3, 4, 3]` formats an input of `1234567890` to `123 4567 890`. |
| cvv | `object` | Defines what type of CVV pattern should be used. <br /> The key `default`'s value is an array of integers (usually one integer) that defines the pattern of the CVV. <br /> The key `iconName`'s value is a string that defines which credit card CVV help image will be shown to the user. |

The below example shows what it looks like when multiple custom cards are registered:

```jsx
initialState = {cc: "566864917026678234"};

const customCards = {
    'card-1': {
        // Only matches credit cards with values that
        // **start** with the numbers `566`. A value
        // of `123 1234123412 566` will not be a match.
        match: '^566',
        format: {
            // This credit card formats their numbers
            // like `xxxx xxxxxxxxxx xxxx`
            default: [4, 10, 4]
        },
        cvv: {
            // The CVV number will be formatted as `xxx`
            default: [3],
            iconName: 'default-hint'
        }
    },
    'card-2': {
        // Only matches credit cards with values that
        // **start** with the numbers `633`. A value
        // of `123 1234123412 633` will not be a match.
        match: '^633',
        format: {
            // This credit card formats their numbers
            // like `xxxx xxxx xxxx xxxx`, just like
            // Visa cards, etc.
            default: [4, 4, 4, 4]
        },
        cvv: {
            // The CVV number will be formatted as `xxxx`
            default: [4],
            iconName: 'default-hint'
        }
    }
};

CardInput.registerCustomFormat(customCards);

<CardInput
    value={state.cc}
    defaultValue={state.cc}
    onChange={(value)=>{setState({cc: value})}}
    onBlur={()=> {}}
/>
```
