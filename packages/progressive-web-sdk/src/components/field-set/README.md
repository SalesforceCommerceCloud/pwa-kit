```js static
// JS import
import FieldSet from 'progressive-web-sdk/dist/components/field-set'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/field-set/base';
```


## Example Usage

```jsx
<FieldSet legend="Helpful Legend Text">
    <FieldRow>
        <Field label="Address">
            <input type="text" name="address" required />
        </Field>
    </FieldRow>
    <FieldRow>
        <Field label="City">
            <input type="text" name="city" required />
        </Field>
    </FieldRow>
    <FieldRow>
        <Field label="Postal Code">
            <input type="text" name="postal-code" required />
        </Field>
    </FieldRow>
</FieldSet>
```
