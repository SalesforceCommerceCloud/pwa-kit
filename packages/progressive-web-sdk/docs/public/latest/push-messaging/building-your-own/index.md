<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> We've removed this article from the site navigation because Mobify projects that were generated after January 2019 do _not_ include the push messaging technology described below. If you are maintaining a project that was generated before January 2019 that _does_ include push messaging, we have left this documentation in place for you.
  </p>
</div>

Creating a React component that allows visitors to subscribe to Push messaging
is straightforward. At a minimum, the component only needs to do 2 things:
1. Call the `channelOfferShown` Redux action when the component is shown to the visitor
2. Call the `subscribeOnClick` Redux action if the visitor opts in

## Before you begin <a name="before-you-begin" href="#before-you-begin">#</a>
- Understand how to use [Selectors](../../guides/selectors)
- Follow the steps in the [Configuring Push Messaging](../configuration) guide
  to set up your project for push messaging
- You must be using version **v0.15.3 or greater** of the Progressive Web SDK to
  use the push messaging components

## Example <a name="example" href="#example">#</a>
This example React Component describes the notifications the visitor would receive
if they subscribe, along with an "opt in" button that triggers the browser to ask
them to allow push notifications on this site. If allowed, the button is hidden
and a success message is shown instead.

There are 5 things of note:
1. Calling `channelOfferShown` on mount. This is required by Analytics
2. Waiting for Push messaging to load successfully
3. Only showing the component if the visitor can subscribe (for example, if they have not blocked push notifications)
4. Showing a success message instead of the "opt in" button if the visitor subscribed
5. Adding `subscribeOnClick` as the `onClick` method for the "opt in" button

```jsx
import React from 'react'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'

import Button from 'progressive-web-sdk/dist/components/button'
import {canSubscribe, getStatus, isSubscribed} from 'progressive-web-sdk/dist/store/push-messaging/selectors'
import {channelOfferShown, subscribeOnClick} from 'progressive-web-sdk/dist/store/push-messaging/actions'
import {MESSAGING_STATUS} from 'progressive-web-sdk/dist/store/push-messaging/constants'

class OptIn extends React.Component {
    componentDidMount() {
        // [1] When the component has mounted, let Push messaging know it was seen
        this.props.channelOfferShown()
    }

    render() {
        const {canSubscribe, isSubscribed, subscribeOnClick} = this.props

        if (getStatus !== MESSAGING_STATUS.READY || !canSubscribe) {
            /**
             * [2] `getStatus` will equal MESSAGING_STATUS.READY when Push messaging has loaded successfully
             * [3] Once Push messaging is ready, `canSubscribe` will be `true` if the browser supports and
             *     has not blocked Push messaging
             *
             * In either case, return false to not show anything
             */
            return false
        }

        return (
            <div>
                <p>Get notified on all the latest deals, promotions and new products.</p>
                {isSubscribed ?
                    // [4] Conditionally show a success message after subscription
                    <p>Successfully subscribed</p>
                :
                    // [5] Attach `subscribeOnClick` as the `onClick` handler
                    <Button onClick={subscribeOnClick}>Opt In</Button>
                }
            </div>
        )
    }
}

const mapStateToProps = createPropsSelector({canSubscribe, getStatus, isSubscribed})
const mapDispatchToProps = {channelOfferShown, subscribeOnClick}

export default connect(mapStateToProps, mapDispatchToProps)(OptIn)
```
