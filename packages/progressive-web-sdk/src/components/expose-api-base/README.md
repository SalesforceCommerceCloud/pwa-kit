```js static
// JS import
import ExposeApiBase from 'progressive-web-sdk/dist/components/expose-api-base/'
```

## Purpose

This is a base component to expose PWA API to the javascript `window` scope.

## Example Usage

In `web/app/containers/app/container.jsx`, add the following

```jsx static
...
import ExposeApiBase from 'progressive-web-sdk/dist/components/expose-api-base/'
...

    render() {
        ...
        return (
            <Lockup>
            ...
                <ExposeApiBase />
            </Lockup>
        )
    }
...
```

Preview the project, open web developer console and run the following

```js static
window.Progressive.api.navigate('/')
```

The PWA should navigate to home page if it is not on home page.

## Extend ExposeApiBase

Extend off the ExposeApiBase to add more PWA api into the window scope.

```jsx static
import ExposeApiBase from 'progressive-web-sdk/dist/components/expose-api-base/'

class ExposeApi extends ExposeApiBase {
    buildProgressiveApi() {
        return {
            ...super.buildProgressiveApi(),     // Keeping the navigate function
            test: () => {
                console.log('test')
            }
        }
    }
}

export default ExposeApi
```

Include the above component in the `app` container.
