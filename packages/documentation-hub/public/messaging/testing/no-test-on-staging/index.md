There is one specific file change that cannot be tested on staging environment. That is the configuration yaml file. (Example: `merlinspotions.yaml`)

The reason why we cannot test these in Staging environment is due to the fact that the Staging environment doesn't create a web push bundle that contains the staging configuration. The messaging product team is currently looking into the possibility of creating such environment. For now, we will need to be aware of such limitations.

Here is a list of configurations that we need to test for once we are in production:
1.   Showing confirmation banner (More specifically, it is the switch from don't show confirmation banner to show confirmation banner and vice versa)
1.   Showing welcome notification (More specifically, it is the switch from don't show welcome notification to show welcome notification and vice versa)
1.   Welcome notification's title, message, link changes
1.   Split test configuration

For testing 1-3, follow thru the subscription flow.

# Manually testing split test setup

1.  Make sure you are in a state that you can see soft ask
2.  Use the following command in the web inspector console to change the split condition of a user

    `document.cookie = "mobify.webpush.split=20; path=/"`

3.  Navigate or refresh the page until soft ask should show

    Depending on the expected behaviour of the split group you are in, you should see the following cookie `mobify.webpush.user_state` changing its states from `Split Disabled`, `Split Enabled`, and `Asked`

    **Note:** `mobify.webpush.user_state` will only change on the page visit that the soft ask is suppose to show. For example, if the web push setup is to show soft ask every 2 pages, then you will see state change only on every 2nd page view.


**Example:** 20% enable / 80 disable split

In the project ymal file, you should see the following set up:

```javascript
splits:
    - min: 1
      max: 20
      name: webpush-enabled
      enabled: true         // This determines if we should show soft ask or not
      description: Webpush 20% enabled

    - min: 21
      max: 100
      name: webpush-disabled
      enabled: false
      description: Webpush disabled
```

Each user will be assigned a split number (1-100) that you will see as the value of `mobify.webpush.split`. If you set `mobify.webpush.split` in the range of 1-20, you should see the soft ask. If you set `mobify.webpush.split` cookie in the range of 21-100, you should not see soft ask.
