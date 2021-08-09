```js static
// JS import
import FieldRow from 'progressive-web-sdk/dist/components/field-row'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/field-row/base';
```


## Example Usage

```jsx
<form>
    <FieldRow>
        <Field label="Credit Card Number">
            <input type="tel" name="cc-number"/>
        </Field>
    </FieldRow>
    <FieldRow>
        <Field label="Expiration Date">
            <input type="text" name="exp-date" />
        </Field>
        <Field label="CVV">
            <input type="tel" name="cvv" maxLength={3} />
        </Field>
    </FieldRow>
</form>
```
