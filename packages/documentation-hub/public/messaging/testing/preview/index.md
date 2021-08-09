With the proper [cookies set for testing](../cookies/#enable-the-subscription-flow),
the next step is to proceed through the subscription flow,
[register a preview device](#register-a-preview-device) and lastly,
[send a preview message](#send-a-preview-message).

## Subscription

1.  Open the browser dev tools
1.  Navigate to the customer's website
1.  Notice how the opt-in banner appears
    -   If it doesn't, please refer to the [troubleshooting docs](../troubleshooting/)
1.  Accept the opt-in
1.  Accept the subscription
    -   Mobify-hosted scenario
        1.  You get redirected to new domain with the subscription page
        1.  A browser popup prompts for push notification permissions (accept it)
        1.  You get redirected to the customer's homepage
    -   Customer-hosted scenario
        1.  A browser popup prompts for push notification permissions (accept it)
1.  A confirmation banner appears

## Register a preview device

Now that the browser is configured to accept push messages, the next step is to
set it up as a preview device.

1.  Navigate to <https://www.mobifyplatform.com/>
1.  Click on the relevant business from the business switcher.  

> Note:If you don't have access to the Business, find the Business in Mobify Cloud and add yourself to it.  It will then display in the Connection Center.

1.  Click the **Add Campaign** button to create a new campaign
1.  Click the **No Content Configured** button
1.  Select Web Push Notification
1.  Add the content of the message
1.  Click on the **Enable new test browser** link
1.  Follow the instructions (use a new tab to do that)
1.  If all went well, you will see a good, old Javascript alert box as well as a
    push notification confirming the preview registration

## Send a preview message

1.  Click the back arrow to go back to the notification configuration editor
1.  Click **Send Test**
