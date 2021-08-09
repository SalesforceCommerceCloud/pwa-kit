<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> We've removed this article from the site navigation because Mobify projects that were generated after January 2019 do _not_ include the push messaging technology described below. If you are maintaining a project that was generated before January 2019 that _does_ include push messaging, we have left this documentation in place for you.
  </p>
</div>

Included here is a list of available Redux actions and selectors for
Push Messaging. You may find these useful when integrating Push Messaging into
your existing project or when creating your own Push Messaging component.

* [Redux actions](#redux-actions)
* [Reselect selectors](#reselect-selectors)

## Before you begin 

- Understand how to use [Selectors](../../guides/selectors)
- Follow the steps in the [Configuring Push Messaging](../configuration) guide
  to set up your project for push messaging
- Understand the basics of the [built-in Push Messaging
  components](../push-messaging-usage/)
- You must be using version **v0.22.0 or greater** of the Progressive Web SDK to
  use the push messaging components

## Redux actions 
The following actions are located in
`progressive-web-sdk/dist/store/push-messaging/actions`

### subscribeOnClick()
`import {subscribeOnClick} from
'progressive-web-sdk/dist/store/push-messaging/actions'`

Call this to subscribe the user to push notifications, by opening the system-ask
dialog to ask for permissions. If the user has already granted or blocked
permissions for this site, nothing will happen.

Typically, this is added as the React `onClick` event handler for an interactive
element like an opt-in button.

### channelOfferShown()
`import {channelOfferShown} from
'progressive-web-sdk/dist/store/push-messaging/actions'`

Call this when the user has seen a Push messaging component asking them to
subscribe. Typically, this can be called inside the React `componentDidMount`
lifecycle method.

## Reselect selectors 
The following selectors are located in
`progressive-web-sdk/dist/store/push-messaging/selectors`

### isSupported
`import {isSupported} from
'progressive-web-sdk/dist/store/push-messaging/selectors'`

type: _boolean_

Returns `true` if:
* the Push messaging feature has been enabled for the project
* the user's browser supports the Push messaging feature

You can use this to determine whether to show a Push messaging component or not.

### isSubscribed
`import {isSubscribed} from
'progressive-web-sdk/dist/store/push-messaging/selectors'`

type: _boolean_

Whether the user is already subscribed to Push messaging. You can use this to
determine whether a "success" message is shown to the user instead of a button
asking them to subscribe.

### canSubscribe
`import {canSubscribe} from
'progressive-web-sdk/dist/store/push-messaging/selectors'`

type: _boolean_

Whether the user can be subscribed to Push messaging. If this is false, it may
mean the user has blocked permissions for push notifications on this site.

### getPageCount
`import {getPageCount} from
'progressive-web-sdk/dist/store/push-messaging/selectors'`

type: _number_

The number of pages the user has seen, persisted over multiple visits to the
site. You can use this to only show a Push messaging component after a certain
number of pages have been seen, which could prove a higher level of engagement
with the site.

### getStatus
`import {getStatus} from
'progressive-web-sdk/dist/store/push-messaging/selectors'`

`import {MESSAGING_STATUS} from
'progressive-web-sdk/dist/store/push-messaging/constants'`

type: _number_

The loading status of the Messaging feature. `getStatus` should always be
compared to values from the `MESSAGING_STATUS` constants object (import
instruction shown above). The `MESSAGING_STATUS` object has 3 values to compare
against:

```bash
MESSAGING_STATUS.LOADING // Messaging is loading
MESSAGING_STATUS.READY // Messaging is ready to subscribe visitors
MESSAGING_STATUS.FAILED // Messaging has failed to load
```

Use this selector to determine whether to show a Push messaging component or
not. For example, you could display a loading spinner if this selector is equal
to `MESSAGING_STATUS.LOADING` or hide a Messaging component if this selector is
equal to `MESSAGING_STATUS.FAILED`. See [Building Your Own Opt-In
Component](../building-your-own/#example) for a detailed example which includes
the use of the `getStatus` selector and the `MESSAGING_STATUS` constants object.


<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>