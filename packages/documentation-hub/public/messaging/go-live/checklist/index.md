If you can answer all of the following questions with "yes", your project is ready to
be rolled out:

-   Is the messaging enabled for your project? (Ask your Mobify project manager if you're not sure)
    -   For details, please refer to the [docs](../../deployment/requirements/)
-   Are all values in the site config correct?
    -   For details, please refer to the [docs](../../create-a-webpush-project/webpush-configurations/)
-   Is the project deployed to production?
    -   For details, please refer to the [docs](../../deployment/production/)
-   Have you tested the subscription flow?
    -   For details, please refer to the [docs](../../testing/what-to-test/)
-   Did you send a preview message?
    -   For details, please refer to the [docs](../../testing/preview/)
-   Is Google Analytics configured?
    -   Is ecommerce instrumentation required? If so, has it been added?
    -   For details, please refer to your Mobify project manager.

If you answered all of the above with "yes": Congratulations! It's time to launch
your project.

## Roll out in stages

A split functionality allows you to roll out the messaging project in stages.
The [site config](../../create-a-webpush-project/webpush-configurations/) contains a `splits` array
that looks like this:

```yaml
splits:
      # The minimum split roll in this split (inclusive)
    - min: 1
      # The maximum split roll included in this split (inclusive)
      max: 4
      # The split name for reporting to GA
      name: first
      # Whether this split group receives web push asks at all
      enabled: true
      # Split description for debugging
      description: The first group to be enabled
    - min: 5
      max: 50
      name: second_soft_launch
      enabled: false
      description: First 50%
    - min: 51
      max: 100
      name: all
      enabled: false
      description: Everyone
```

The above settings read: Show the opt-in dialog to 4% of website visitors.

The `enabled` flag for each split allows you to set which groups of visitor get
to see the opt-in dialog. Use the `min` / `max` values to specify a range.
You can add as many splits as you like.
