```js static
// JS import
import ListTile from 'progressive-web-sdk/dist/components/list-tile'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/list-tile/base';
```


## Example Usage

```jsx
<ListTile>
    This is a ListTile component
</ListTile>
```


## Example With Actions

ListTile components can have a `startAction` and/or an `endAction` prop passed to it.

```jsx
<div>
    <ListTile startAction={
        <Icon name="cart" />
    }>
        <div>ListItem with <code>startAction</code> only</div>
    </ListTile>

    <ListTile endAction={
        <Button className="pw--blank" icon="lock" />
    }>
        <div>ListItem with <code>endAction</code> only</div>
    </ListTile>

    <ListTile startAction={
        <Button className="pw--blank" icon="user" />
    } endAction={
        <Button className="pw--blank" icon="chevron-right" />
    }>
        <div>ListItem with  <code>startAction</code> and <code>endAction</code></div>
    </ListTile>
</div>
```


## Example With `href`

```jsx
<div>
    <ListTile href="http://www.mobify.com">
        <div>ListTile with an <code>href</code> prop. Notice the change in color!</div>
    </ListTile>

    <ListTile href="http://www.mobify.com" startAction={
        <Icon name="basket" />
    } endAction={
        <Button className="pw--blank" icon="star" />
    }>
        <div>
            Notice secondary action is included in the anchor. If you wish to change this behavior,
            see the example below.
        </div>
    </ListTile>

    <ListTile startAction={
        <Button className="pw--blank u-link-color" href="http://www.mobify.com" icon="chevron-left" />
    } endAction={
        <Button className="pw--blank u-link-color" href="http://www.mobify.com" icon="chevron-right" />
    }>
        Of course, elements inside can be their own anchors.
    </ListTile>
</div>
```


## Example With `includeEndActionInPrimary` Set to False

The `endAction` by default is wrapped by the `pw-list-tile__primary` wrapper. We've chosen this behavior as in most cases, clicking on the ListTile and on the endAction should have the same effect. This can be altered by applying `includeEndActionInPrimary={false}`.

```jsx
<ListTile includeEndActionInPrimary={false} href="http://www.mobify.com" endAction={
    <Button className="pw--blank" icon="chevron-right" />
}>
    <div>ListTile with the <code>endAction</code> outside of the primary container</div>
</ListTile>
```

## Example with `onMouseEnter` and `onMouseLeave` hover events

```jsx

initialState = {
    isHovering: false
};


<div>
    <ListTile
        onMouseEnter={() => setState({isHovering: true})}
        onMouseLeave={() => setState({isHovering: false})}
        endAction={
            state.isHovering ? '🐭' : '🧀'
    }>
        <div>Hover Me!</div>
    </ListTile>
</div>
```
