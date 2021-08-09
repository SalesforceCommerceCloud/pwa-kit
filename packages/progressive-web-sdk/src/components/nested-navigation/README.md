```js static
// JS import
import NestedNavigation from 'progressive-web-sdk/dist/components/nested-navigation'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/nested-navigation/base';
```


## Example Usage

```jsx
// We need this semicolon for styleguidist to work
let nav = {};

<div>
    <NestedNavigation
        ref={(el) => {
            nav = el
        }}
        header={{
            previousAction: <Button>Back</Button>
        }, {
            endActions: [<Button>Close</Button>]
        }}
        component={ListTile}
        duration={250}
        data={{
            title: 'Phone Book',
            items: [{
                title: 'A',
                items: [{
                    title: 'Aaron',
                    items: [{
                        title: 'Contact Card',
                        items: [{
                            title: 'mobile',
                            items: [{title: '(778) 123-3213'}]
                        }, {
                            title: 'instagram',
                            items: [{
                                title: '@aaron'
                            }]
                        }]
                    }]
                }]
            }, {
                title: 'B',
                items: [{
                    title: 'Ben',
                    items: [{
                        title: 'Contact Card',
                        items: [{
                            title: 'mobile',
                            items: [{title: '(778) 288-1237'}]
                        }, {
                            title: 'email',
                            items: [{title: 'ben@email.com'}]
                        }, {
                            title: 'instagram',
                            items: [{title: '@bendvc'}]
                        }]
                    }]
                }, {
                    title: 'Brent',
                    items: [{
                        title: 'Contact Card',
                        items: [{
                            title: 'mobile',
                            items: [{title: '(778) 444-3322'}]
                        }, {
                            title: 'email',
                            items: [{title: 'brent@email.com'}]
                        }, {
                            title: 'instagram',
                            items: [{title: '@brent'}]
                        }]
                    }]
                }]
            }, {
                title: 'C',
                items: [{
                    title: 'Cindy',
                    items: [{
                        title: 'Contact Card',
                        items: [{
                            title: 'mobile',
                            items: [{title: '(778) 323-3344'}]
                        }, {
                            title: 'email',
                            items: [{title: 'cindy@email.com'}]
                        }, {
                            title: 'instagram',
                            items: [{title: '@cindy'}]
                        }]
                    }]
                }, {
                    title: 'Carl',
                    items: [{
                        title: 'Contact Card',
                        items: [{
                            title: 'mobile',
                            items: [{title: '(778) 342-2342'}]
                        }, {
                            title: 'email',
                            items: [{title: 'carl@email.com'}]
                        }, {
                            title: 'instagram',
                            items: [{title: '@carl'}]
                        }]
                    }]
                }]
            }]
        }}
    />
</div>
```

## Custom Component Example

```jsx
let nav2 = {};
<div>
    <NestedNavigation
        ref={(el) => {
            nav2 = el
        }}
        duration={250}
        data={{
            title: 'Phone Book',
            items: [{
                title: 'Button Components',
                items: [{
                    title: 'You can set the component',
                    component: Button
                }, {
                    children: <Button href="http://www.mobify.com">Button to Mobify</Button>
                }, {
                    children: <Button onClick={() => alert('Hello')}>Say Hi</Button>
                }, {
                    title: 'Ipsum',
                    children: <Button disabled={true}>Example</Button>
                }]
            }]
        }}
    />
</div>
```

If you set the component prop of an item, that component will be rendered. If you set the children prop of an item, those children will be rendered inside a ListTile (or whatever component you set on the NestedNavigation)
