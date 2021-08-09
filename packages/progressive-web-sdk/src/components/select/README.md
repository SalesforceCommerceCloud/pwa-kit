```js static
// JS import
import Select from 'progressive-web-sdk/dist/components/select'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/select/base';
```


## Example Usage

```jsx
<Select
    options={[{text: 'Arizona', value: 'AZ'}, {text: 'New York', value: 'NY'}]}
    selectedIndex={1}
    isRequired
    className="c--test"
></Select>
```

*Select with Name attribute set*

```jsx
<Select
    options={[{text: 'Arizona', value: 'AZ'}, {text: 'New York', value: 'NY'}]}
    isRequired
    name="test-name"
></Select>
```

*Select with Multiple attribute set*

```jsx
<Select
    options={[{text: '1', value: '1'}, {text: '2', value: '2'}, {text: '3', value: '3'}, {text: '4', value: '4'}, {text: '5', value: '5'}]}
    isRequired
    multiple
></Select>
```

*Disabled Select*

```jsx
<Select
    options={[{text: 'Arizona', value: 'AZ'}, {text: 'New York', value: 'NY'}]}
    isDisabled
></Select>
```

*Select with Alternate Icon*

```jsx
<Select
    options={[{text: 'Arizona', value: 'AZ'}, {text: 'New York', value: 'NY'}]}
    iconProps={{name: 'chevron-bottom'}}
></Select>
```
