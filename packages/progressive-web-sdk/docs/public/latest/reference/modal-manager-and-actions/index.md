<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> We've removed this article from the site navigation because Mobify projects that were generated after January 2019 do _not_ include the Modal Manager technology described below. We plan to update our documentation soon to reflect this change and provide new instructions for implementing modals using the [Sheet component](../../components/#!/Sheet). Stay tuned! If you are maintaining a project that was generated before January 2019 that _does_ include the Modal Manager, we have left this documentation in place for you.
  </p>
</div>

This article is split into two major sections. The first covers the features of the Modal Manager in detail, and the second covers all the actions that the Progressive Web SDK provides for showing and hiding modals.

This article does not detail the React components used by modals, nor is this a basic, guided introduction to using modals in a PWA. For those, please see the [Sheet component](../../components/#!/Sheet) and [Getting Started: Adding a Modal](../../getting-started/adding-a-modal/) documentation.

## Modal Manager view options <a name="modal-manager-options" href="#modal-manager-options">#</a>

The Modal Manager comes with a few features that give you more control over how a modal behaves. These features can be passed as options to an object in the `MODAL_VIEWS` list:

```js
// web/app/modals/index.jsx
const MODAL_VIEWS = {
    [EXAMPLE_MODAL]: {
        content: <ExampleModal />,
        duration: 200,
        prerender: false,
        startsPersistent: false
    },
}
```

**content**: `React.Component`, the component that will render when the modal is open.

**duration**: `integer`, a custom duration in milliseconds for the open/close animation.

**prerender**: `boolean`, determines whether the sheet renders while closed. Pre-rendering modals continue to render in the DOM but remain visually hidden. Useful for showing content to search engine crawlers.

**startsPersistent**: `boolean`, determines whether the sheet remains open on a route change. When persistence is applied in this manner, it only works the first time it's opened. Subsequent open/closes will leave the modal in a non-persistent state (as normal).

## Actions <a name="actions" href="#actions">#</a>

All actions are imported as follows:

```js
import {
    openModal,
    closeModal,
    openPersistentModal,
    closeAllModals,
    persistModal,
    preRenderModal
} as modalAction from 'progressive-web-sdk/dist/store/modals/actions'
```

Their purpose and behavior is described below.

### openModal(id, analyticsName) <a name="open-modal" href="#open-modal">#</a>

Opens the given modal.

If your project is using the [Lockup component](../../components/#!/Lockup) then it is considered good practice to use the action defined in your project that both locks the application and opens the modal: `openModal` (same name) in `web/app/modals/actions.js`

**id**: `string`, the unique identifier for a given modal.

**analyticsName**: `string`, a name for the analytics event triggered by this action.

**returns**: `function`, passed to a `dispatch`

---

### closeModal(id, analyticsName) <a name="close-modal" href="#close-modal">#</a>

Closes the given modal.

If your project is using the [Lockup component](../../components/#!/Lockup) then it is considered good practice to use the action defined in your project that both locks the application and opens the modal: `closeModal` (same name) in `web/app/modals/actions.js`

**id**: `string`, the unique identifier for a given modal.

**analyticsName**: `string`, a name for the analytics event triggered by this action.

**returns**: `function`, passed to a `dispatch`

---

### openPersistentModal(id, analyticsName) <a name="open-persistent-modal" href="#open-persistent-modal">#</a>

Opens the given modal and sets it to be persistent (doesn't close during a route change).

**id**: `string`, the unique identifier for a given modal.

**analyticsName**: `string`, a name for the analytics event triggered by this action.

**returns**: `function`, passed to a `dispatch`

---

### closeAllModals() <a name="close-all-modals" href="#close-all-modals">#</a>

Closes all modals.

**returns**: `function`, passed to a `dispatch`

---

### persistModal(id, analyticsName) <a name="persist-modal" href="#persist-modal">#</a>

Sets the given modal to be persistent.

**id**: `string`, the unique identifier for a given modal.

**analyticsName**: `string`, a name for the analytics event triggered by this action.

**returns**: `function`, passed to a `dispatch`

---

### preRenderModal(id, analyticsName)

Sets the given modal to pre-render. The `prerender` state means that the modal, when inactive/closed, will still render its markup in the DOM. This is useful situations where you want the DOM visible for things like search engine crawlers.

**id**: `string`, the unique identifier for a given modal.
**analyticsName**: `string`, a name for the analytics event triggered by this action.
**returns**: `function`, passed to a `dispatch`
