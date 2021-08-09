```js static
// JS import for use with just the rows data property
import {Ledger} from 'progressive-web-sdk/dist/components/ledger'
// JS import for use with custom <LedgerRow> children
import {Ledger, LedgerRow} from 'progressive-web-sdk/dist/components/ledger'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/ledger/base';
```
**Details of rows prop**:

The object should contain the following keys:
* label: The label for the ledger entry.
* value: The value for the ledger entry.
* isTotal: A bool indicating if the ledger entry is the final total row.
(this row will be styled differently than previous rows)

## Example Usage
*Passing LedgerRow children to the ledger*

```jsx
<Ledger>
    <LedgerRow label="Name" value="test" />
</Ledger>
```

*Passing Data to the ledger*

```jsx
<Ledger rows={[{
        label: 'Subtotal',
        value: '$12.99'
    },
    {
        label: 'Tax',
        value: '$0.00'
    },
    {
        label: 'Grand Total',
        value: '$12.99',
        isTotal: true
    }]}
/>
```

*Defining actions for the label or value cells*

```jsx
<Ledger>
    <LedgerRow
        className="u-sale-color"
        label="Promo Code Applied"
        labelDescription="20% off all clothes"
        value="-$5.00"
        labelAction={
            <Button className="pw--link u-margin-start-sm" text="Remove" />
        }
    />

    <LedgerRow
        className="u-sale-color"
        label="Coupon Code"
        value="-$5.00"
        valueAction={
            <Button className="pw--link" text="Remove Promo" />
        }
    />

    <LedgerRow
        label="Shipping"
        labelAction={
            <Button className="pw--link u-margin-start-sm" text="More Info" />
        }
        labelDescription="Label description"
        value="$0.00"
    />

    <LedgerRow
        label="Tax"
        labelAction={
            <Button className="pw--link" text="More Info" />
        }
        value="$0.00"
    />
</Ledger>
```
