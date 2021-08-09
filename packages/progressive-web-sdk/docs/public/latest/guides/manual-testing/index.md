This guide outlines some best practices and tips for manually testing Mobify PWAs. After reading this, you'll have a preliminary understanding of the following topics:
* The relationship between desktop and PWA business logic
* Testing on physical devices
* Assessing PWA performance

## Desktop Business Logic <a name="desktop" href="#desktop">#</a> 
A Mobify PWA often leverages existing desktop business logic. Developers do this by methods such as page parsing or using the existing desktop’s backend API. Because of this, it’s important to verify functionality on the desktop page when assessing the functionality of your PWA.

When manually testing a new feature, it’s good practice to have the PWA and the desktop site in separate windows side by side for easy reference.

### QA Tips:
* Verify that pages and workflows transform well from desktop to mobile
* Verify that the data sent by desktop and the data sent by the PWA matches appropriately
* Investigate the discrepencies if they are different
* If there is a bug on desktop - keep in mind that they usually won’t be fixed on mobile when we transform it
* Communicate to the customer existing bugs to fix on their end

It’s important to note that because of this dependency with Desktop that there’s a butterfly effect risk. The PWA relies upon existing functionality on desktop and any changes to the desktop will in turn affect the mobile site. We need to be proactively testing and be aware of desktop changes.


## Devices <a name="devices" href="#devices">#</a> 
Ecommerce customers are not viewing our mobile application on Desktop computers, nor are they using Chrome DevTools in mobile mode. They’re viewing our sites on physical devices such as iPhones, Androids and Samsungs etc. When testing we want to have an environment that closely simulates an end user experience. It’s thus important to be testing on physical devices with scrutiny to give us the confidence of quality. 

### QA Tips:
* Screen sizes
    * It’s important to consider different phone sizes such as an iPhone SE vs iPhone 7. Even though they’re on the same version of iOS, they may display the same site differently.

* Device Browsers
    * Identify the project scope of device versions
    * Check [compatibility matrix](https://docs.mobify.com/platform/compatibility/#fn1) for major device versions
    * If push notifications are included in a PWA, it is important to verify them appropriately on their native devices

* Keyboards
    * Pay attention to the keyboard that gets triggered when entering forms
    * For numeric-only fields, we should have the Numeric Keyboard
    * The postal/zip code field should be numeric only in the case where the shipping is restricted to the US. Postal codes may vary by the region the user is in/has selected; always use the keyboard most suitable for that region.
    * For email fields, we should have the Email-specific Keyboard (with the @ symbol)
    * For search fields, we should have the Search Keyboard
    * For more information, see our guide to [Working with Forms](../guides/forms/#user-experience)

* Connect the device via USB to the computer so we’re able to have DevTools open to view the console and network traffic. You can find instructions on how to do so [here](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/).

* Error messages
    * Highlight the form field with the error in red
    * Display the associated error message close to the error field so that your site visitor corrects the faulty input
    * Enable scroll-to-field for form error correction
    * The style of the displayed error messages should be consistent across browsers and devices

* Use the browser Back Button
    * Common bugs include the page not loading or requiring to double tap this button to go back

## Performance <a name="performance" href="#performance">#</a>
Progressive Web Apps boast a reliable, fast and engaging user experience. To test this, we must assess the quality of speed and positive user-experience of the site in all aspects.

For more information about [designing for performance](https://www.mobify.com/insights/designing-appearance-speed/), check out [our article](https://www.mobify.com/insights/designing-appearance-speed/) on visual design best practices that can convey a sense of speed.

### Key Elements:
* Scrolling should be smooth. You can check FPS using Chrome DevTools. More information can be found [here](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/).
* Opening and Closing components
    * Menus, Keyboard, Form Fields - should all have a smooth experience
* Page Transitions
    * Going from page to page should have a smooth loading experience
    * Part of our practice includes the existence of skeletons (the light-gray squares that indicates loading) and placeholder content
    The presence of placeholder content smoothens the experience between page to page
* Spinners / Loaders
    * Should only be in necessary situations
    * In most cases, they should be in checkout during the events of when the user is submitting form data
* Cached Content
    * Content should pre-populate whenever they’re available
    * Eg: going from PLP to PDP - should display the title and price of the PDP on the page during the transition within minimum loading
* Back Button
    * Should instantly display pages we’ve visited before 

## Network <a name="network" href="#network">#</a>
With the goal of testing using the end user’s environment, we need to simulate mobile connection speeds in which the user is not connected to fast Wi-Fi.

There are ways to throttle your connection using Chrome DevTools in the Network Tab. More information can be found [here](https://developers.google.com/web/tools/chrome-devtools/network-performance/network-conditions).

Having throttling enabled also makes it easier to see how content, such as the page transitions, load into place. This allows you to verify whether the experience is positive. We recommend using regular 3G (750 kb/s download, 250 kb/s upload, 100ms RTT).

We also have the following tools that can give us a lot of performance metrics:
* [Pagespeed](https://developers.google.com/speed/pagespeed/insights/)
* [Lighthouse](https://developers.google.com/web/tools/lighthouse/)
* [Webpage Tests](https://www.webpagetest.org/)