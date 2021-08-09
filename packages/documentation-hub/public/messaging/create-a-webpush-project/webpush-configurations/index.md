Every web push project will have a file in the following format `<site_id>.yaml`. For example, for Merlins Potion it's `merlinspotion.yaml` at the root folder of its web push project.

This particular file contains the configurations of how **Web Push Server** should interact with this particular project. **Web Push Server** will check the production deployed configuration file every 5 minutes.

Below is a list of Web Push server configuration that you can find in the web push project's yaml file.

|Key                            |Description        |
|-------------------------------|-------------------|
|`netloc`                       |Host name of the client's site without protocol
|`site_id`                      |Web Push identifier (Allowed format: lower case alphabet, dashes)
|`config`                       |Web Push configuration block
|`cloud_slug`                   |Associated Mobify Cloud project slug
|`friendly_site_name`           |Used for display in Cloud
|`business_slug`                |The client's business identifier this project belongs to
|`business_name`                |The client's business name
|`hosting_domain`				|The domain the user is subscribing notification to
|`target_domain`				|The client's domain that web push should associated to
|`load_host_client`             |Set **false**, when web push is Mobify hosted.<br/>Set **true**, when web push is Client hosted|
|`in_development`               |Puts the project in development mode and which allows in-depth debugging
|`service_worker_debug`			|Setting to get service work to start logging debug messages
|`support_client_global_delete` |Always set **false**.<br/>This is only for demo sites which allows an endpoint to remove all current client subscription removal
|`default_icon_url`				|Default url to the icon asset
|`default_url`					|Default url to navigate when the notification is interacted
|`default_message_title`		|Default notification title
|`fallback_message_text`		|Default notification message
|`show_confirmation`            |Shows a one-time confirmation banner on client's site upon registration
|`send_welcome_message`			|Set **true** to send a one-time welcome message notification upon registration.<br/>Please make sure `welcome_message_url`, `welcome_message_title`, and `welcome_message_text` is defined of this configration is set to true.
|`welcome_message_url`			|Welcome message url
|`welcome_message_title`		|Welcome message title
|`welcome_message_text`			|Welcome message text
|`use_service_worker_loader`	|Set **false**, when web push is Mobify hosted.<br/>Set **true**, when web push is Client hosted|
|`apn_website_push_id`			|Apple Web Push ID for this site
|`apn_certificate_name`			|Apple Web Push certificate name for this site
|`splits`						|Split test configuration (Further detail below)
|`dimension_index`  |The dimension index slots to use when sending to GA. You shouldn't be changing these dimension indexes unless specifically instructed. (`split_name`, `split_roll`, `user_state`, `session_state` should be mapped to 3, 4, 5, 6 respectively|

Note: you can comment out the fields that may not be applicable such as `apn_app_id`, `apn_native_sandbox_certificate_name`, `trampoline_url`, etc.

For additional configuration properties, please refer to the [Web Push Site Config Documentation](https://webpush.mobify.net/docs/site_configs/reference/)

## How to set splits

Every user will be assign a number in the range of 1 to 100.

A split condition is defined in a block, indicated by a dash

```c
splits:
    - min: 1
      max: 40
      name: webpush-enabled
      enabled: true
      description: This group is webpush enabled
```

|Split Key		|description|
|---------------|-----------|
|`min`			|The lower bound of this split condition
|`max`			|The upper bound of this split condition
|`name`			|The name of this split condition. Used for sending analytic data.
|`enabled`		|Boolean value to allow web push subscription flow to work
|`description`	|Description for debugging logging

An example of a 40/60 split

```c
splits:
    - min: 1
      max: 40
      name: webpush-enabled
      enabled: true
      description: This group is webpush enabled
    - min: 41
      max: 100
      name: webpush-disabled
      enabled: false
      description: This group is webpush disabled
```

**Note**: The min/max bounds are inclusive numbers. So if a user is assigned 40, this user will be in the webpush enabled group.
