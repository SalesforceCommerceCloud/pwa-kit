## A few tips to get you started

Before beginning an ecommerce site build with the Mobify Platform, we have a few tips to help streamline your process.

-   **Know the best practices**: We’ve created these docs to help you in your day-to-day, and to make conscious decisions that will have positive impacts on end users. Review our best practices below for an overview of the large- and small-scale things that we have tried and tested to be true for PWAs and native apps. Having an understanding of these practices will allow you to shape your design at the beginning, rather than revising later based on feedback. Iterating is good — iterating on things that have already been integrated: not so good.
-   **Get the tools**: Further down in this section, we recommend a set of tools and resources that you may find helpful. They're what we have tested and come to love here at Mobify — maybe you will too.
-   **Use the evidence**: Even though you'll likely have some defined usages and procedures, there is no one method to designing an ecommerce site. What matters most is that you have sufficient evidence to support your choices and decisions. You gather that evidence through data analysis and user testing to uncover solutions that fit with real shoppers’ desires and requirements. That doesn’t mean you should not use your gut reaction based off of past design experience — the best designers know what feels right, but remember that numbers don’t lie. As Erika Hall, Co-founder of Mule Design says, “Of course we will often have to do some sort of research to gather the evidence, but those activities are as integral to the design process as sketching or writing. We know we have done them well to the extent they made the design stronger and give us confidence in our decisions.” Before beginning a project, get access to any data you can, such as analytics, past user tests, or any feedback sessions.
-   **Have access to feedback**: Mobify will support you through your design process, and we're here to help through design review, user testing facilitation, art direction, or even just general guidance. Don’t be afraid to reach out to the Mobify Design Team if you require anything along the way.

## Essential skills

In general, we suggest that designers working on the Mobify Platform have the following experience and team dynamics:

<div class="c-scroller">
    <table>
      <tr>
        <td>Experience</td>
        <td>3+ years working as an interaction designer. Will typically hold the title of Intermediate or Senior Interaction Designer.</td>
      </tr>
      <tr>
        <td>ecommerce</td>
        <td>Has worked on ecommerce experiences in the past. Ideally mobile / responsive experience but in some cases experience may be limited to desktop designs.</td>
      </tr>
      <tr>
        <td>Mobile First</td>
        <td>Understanding of how mobile-first responsive design works; may have produced — or contributed to — four or more projects.</td>
      </tr>
      <tr>
        <td>Craft</td>
        <td>Has a passion for UI and UX design, on all platforms and cares greatly about the smallest of micro-interactions that might affect the user experience. Able to identify unique design patterns and systems and how to best use them.</td>
      </tr>
      <tr>
        <td>Team Structure</td>
        <td>Works within a team of three or more designers at varying levels from intermediate to senior. Design team has a dedicated design manager or leader who ensure design quality is of the highest caliber. </td>
      </tr>
      <tr>
        <td>Technical</td>
        <td>Has at least a basic understanding of HTML and CSS and is comfortable working within Google Chrome DevTools to understand the underlying code of a site. Active in collaborating with their engineering team to ensure designs are built with the user experience as number one priority.</td>
      </tr>
      <tr>
        <td>Methodology</td>
        <td>Your team believes in taking a user-centered design approach where the shopper is the center of the conversation. Research, data, and best practices are used over opinion and trend.</td>
      </tr>
    </table>
</div>

<!--lint disable no-duplicate-headings-->

## Mobile ecommerce conventions

As you read through this guide, you’ll notice a variety of acronyms and ecommerce terminology that may be unfamiliar if you're relatively new to ecommerce design. Let’s review some of these conventions now so that you’ll be well-equipped going forward.

There is no way to predict where the shopper will land on the PWA experience (more on this later). They may be directed from an email newsletter, they may follow a link from a social media newsfeed, or perhaps they will type in the URL directly; they could begin their journey at any page! Even though shoppers will not always conform to a specific pattern, we typically refer to the “buyer’s journey” as the act of navigating through a particular flow, namely Home > Category Listing Page (CLP) > Product Listing Page (PLP) > Product Detail Page (PDP) > Cart > Checkout. Let’s review each of these core templates.

<figure class="u-text-align-center">
    <img src="images/design.001.jpeg" alt="Major templates of a mobile ecommerce experience" />
    <figcaption>Each of the major templates of a mobile ecommerce experience have different use cases.</figcaption>
</figure>

### Homepage

An ecommerce homepage is usually reserved for displaying promotions and recent news and developments. Additionally, it should offer a clear overview of the site structure, and give shoppers a launchpad into products and offerings. It’s crucial that the homepage allows users to quickly infer the purpose of the site, in addition to learning the kinds of products available. This is usually accomplished with a visual category list navigation.

<figure class="u-text-align-center">
    <img src="images/home-example.png" alt="Example homepage layout" />
</figure>

* * *

### Category Listing Page (CLP)

The Category Listing Page (CLP) shows a list of product categories. Often in ecommerce sites, products are organized into a tree structure; for example, a running shoe may be categorized in the following manner: Women > Footwear > Sports. A CLP can be top-level or a sub-category. It is different from a PLP, described next, as it does not primarily showcase products.

#### Key Interactions:

-   Can sort and filter product results.

* * *

### Product Listing Page (PLP)

The Product Listing Page (PLP) shows all products available within a certain category. A PLP is a sub-category. It is different from a CLP as it exists to showcase _products_, not additional sub-categories.

<figure class="u-text-align-center">
    <img src="images/plp-example.png" alt="Merlins Potions PLP page" />
</figure>

#### Key Interactions:

-   View product variations (e.g. colour or size) with quick preview.
-   Sort and filter product results.
-   Buy products instantly (Quick Pay with _Apple Pay_ / _Android Pay_).

* * *

### Product Detail Page (PDP)

The Product Detail Page, commonly known as a PDP, is a page or screen that offers full details on a specific product, along with purchasing options and controls to add to cart, wishlist, or buy immediately. PDPs are traditionally the primary purchasing interface for a product. They're often an endpoint for PLPs, search results, and sales tactics such as sales promotions, or push notifications.

<figure class="u-text-align-center">
    <img src="images/pdp-example.png" alt="A product detail page example" />
    <figcaption>The PDP is a page or screen that offers full details on a specific product, along with purchasing options and controls to add to cart, wishlist, or buy immediately.</figcaption>
</figure>

#### Key Interactions:

-   Scroll through product images in an Image Carousel.
-   Zoom in on product images with the Product Zoom pattern.
-   Disclose product details.
-   Select Product Options.
-   Add product to a wishlist.
-   Add a product to cart.
-   Buy product immediately (Quick Pay with _Apple Pay_ / _Android Pay_).

* * *

### Cart

The cart (often named “bag” or “shopping bag”) is a listing of all items the shopper has reserved for purchasing, along with functions to checkout. The cart is typically accessible as a singular template (e.g. `/cart`), but sometimes available from every page/screen as a mini-cart.

![Examples of shopping carts](images/cart-example.png)

#### Key Interactions:

-   Interactions are variable and depend on the customer’s business logic.
-   Adjust quantity of items in cart.
-   Adjust options for items in cart.
-   Remove items from cart.
-   Add a promotional code.
-   Select shipping option.
-   Choose gift wrapping.
-   Begin checkout flow with various payment options.

* * *

### Checkout

The checkout flow is arguably the most critical area of an ecommerce website or app — in fact, optimizing a checkout flow design has been shown by the Baymard Institute to increase conversion rates by up to 35.2%. (NOTE:  Appleseed, Jamie, Christian Holst, Thomas Grønne, Edward Scott, Lauryn Smith, and Christian Vind. “ecommerce Usability: Checkout.” Accessed December 13, 2016.) The user experience of an ecommerce checkout also has lasting effects on brand perception and repeat business potential.

The primary purpose of an ecommerce checkout is to collect billing and shipping information from the user to complete the purchase.

#### Key Interactions:

-   The majority of interactions within a Checkout are form input fields such as:
    -   Full Name
    -   Billing Address
    -   Shipping Address
    -   Email Address
    -   Phone Number
    -   Credit Card Details

-   The confirmation action is the final critical action required by the user to complete the purchase.

## Tools

To get your team coding as quickly as possible, we recommend using a grid- and unit-based approach in Sketch, together with inspection tools such as [InVision Inspect](http://invisionapp.com) or [Zeplin] (https://zeplin.io/).

The following is a list of design tools that are both industry-tested and readily available. Although we stand behind all the tools on this list, it's up to you to determine which tool and approach will best communicate your design ideas.

* * *

### Sketch

**What:** [Sketch](https://sketchapp.com/) is a vector-based user interface design tool. It is also completely vector-based, as opposed to raster-based editing apps such as Photoshop. We like Sketch for its ability to easily manage multiple pages and variable artboard sizes, allowing designers to keep an entire project in a single file for easy management.

**Our assessment:** We recommend using Sketch instead of Photoshop as Sketch is suited to building precise _CSS_ layouts. However, you’ll probably want a license for both as Photoshop is stronger for photo manipulation and retouching.

* * *

### Sketch Mirror

**What:** [Sketch Mirror](https://sketchapp.com/learn/documentation/mirror/mirror/) is an iOS app that enables mirroring between Sketch and iOS devices. You can use this to view your mockups on an actual device.

**Our assessment:** It’s a great tool that will allow you to better understand how your designs will feel and function in the intended context.

* * *

### Crystal

**What:** [Crystal](https://play.google.com/store/apps/details?id=com.smithyproductions.crystal&hl=en) is an app on the Google Play store that will allow you to view your `.sketch` designs on an Android device.

**Our assessment:** Very similar in functionality to Sketch Mirror (described previously). We always recommend previewing designs on the physical device for which they are designed.

* * *

### InVision

**What:** [InVision](http://invisionapp.com) is a prototyping tool that allows you to test inter-screen interactions and user flows. You can drop in `.sketch` and `.psd` files directly, and add many standard transitions, such as slide-in, fade, or pop. InVision Sync allows you to keep all of your prototypes locally on your computer and have your shared prototypes update as you work.

**Our assessment:** We rely on InVision to communicate user flow and design systems with development teams; it’s also pretty great for collecting feedback from customers, using the commenting features.

* * *

### Principle

**What:** [Principle](http://principleformac.com/) is a prototyping tool for creating user interactions and animations.

**Our assessment:**  This app is best for micro-interactions within the page, and complements how we use InVision. We use Principle for designing same-page movement, and InVision for designing the inter-page movement between pages. Principle includes a powerful suite of Keynote-like motion tools for quickly mocking up interactions.

* * *

### Visual Studio Code

**What:** [Visual Studio Code](https://code.visualstudio.com/) is a free and open source text editor, available for macOS, Windows, and Ubuntu. Additional functionality can be added with extensions available through the [VS Code Marketplace](https://marketplace.visualstudio.com/VSCode).

**Our assessment:** We believe that we can only design the very best mobile experiences for shoppers when we fully understand the constraints; one of these constraints is the capabilities and limitations of code. Understanding the medium in which you are designing will only benefit you. Visual Studio Code is our favourite by virtue of its extensibility (and the price is right).

* * *

### ImageOptim

**What:** [ImageOptim](https://imageoptim.com) is a tiny, single-purpose app that reduces image file sizes, while preserving image quality, by applying advanced compression. Reducing your image file sizes will help improve app performance.

**Our assessment:** We appreciate the simplicity, speed, and easy user experience offered by ImageOptim (and the price).

## Mockups

Mockups, or just “mocks”, are fully-realised, often high-fidelity designs that represent exactly how the mobile experience should look. It’s normal practice for Mobify designers to provide two mocked-up templates to show clients in order to get general sign-off on styling and adherence to brand standards. We typically recommend creating a Homepage mockup and a Product Detail Page (PDP) mockup, since they typically cover most of the design language that can be found throughout the app. From these two mocks, information and styles can be re-used for other parts of the app.

<figure class="u-text-align-center">
    <img src="images/image-template.003.jpeg" alt="FUT Product Details Page" />
    <figcaption>We typically recommend providing mockups of the Homepage and the Product Detail Page (PDP) since they typically cover most of the design language.</figcaption>
</figure>

In certain cases, the customer may request a mockup for a specific interaction or component style. For example, they may wish to see a mockup of the checkout instead of the homepage, since the checkout directly affects conversion. Decide which mockups to create by seeking input from the project manager and the customer.

> Design for the smallest screen rather than the largest — it’s easier to expand
> than to shrink (designing with the greatest number of constraints is generally
> a good approach in order to be sure that your solution scales gracefully).
> Often that means designing @1x for the iPhone SE, working at `320px`. (If you
> work in Sketch, it’s easy to export @2x.)

While it’s important to understand how much content fits on a screen at one time, your mockups should not end at the bottom of the viewport. While the client may not need to see every state (though it’s a nice touch, indicating that you’ve really considered every aspect)-- your developers do. Check that you are including designs for:

-   content inside accordions and modals?
-   selected, disabled, or sold-out options and states?
-   promotions, free gifts, add-ons, and shipping notices?

**View an Example:** <https://invis.io/TY7MK0DQD>

In the above example, you can see that the designer included _all_ the content on the page, including the very large technical specifications table. They also tested a worst-case scenario by choosing a product with a long name, a free gift, and add-ons and included additional states and options. Always design for these ‘worst-case’ scenarios versus an idealized state, as this will allow your development team to foresee any challenges and obstacles.

## Documentation

Because your development team will be implementing your designs, we suggest creating a prototype as well as a design handoff document to communicate design intention.

When creating your prototype, use [InVision](http://www.invisionapp.com/), as it provides a higher-level explanation of your design by linking up the templates so that developers can better understand how each template relates to each other.

<figure class="u-text-align-center">
    <img src="images/image-template.001.jpeg" alt="Invision App" />
	<figcaption>Invision App allows you to create hotspots directly on your design that link to other pages</figcaption>
</figure>

It's a good idea to begin each sprint with a sprint planning meeting, where you present the designs and allow the developers and and engineers to raise any issues they may have.

Alternatively, you may wish to create design handoff notes within individual [JIRA story tickets](https://www.atlassian.com/software/jira). (JIRA is our project management tool of choice.) Previously, at Mobify, we used _Google Docs_ to communicate all design notes because it supports a comprehensive method of communicating your designs such as the ability to add links, screenshots, and comments. However, we learned soon that valuable information was being missed as developers moved on and off the project. By consolidating the design notes to specific tickets, any developer working on a specific ticket will have all the information they require to complete the design as per the specifications.

Global design notes that relate to the overall project and touch all features such as styleguides and icons should continue to live in a shared _Google Doc_. This doc must be referenced within each design note ticket so that all developers have access to it at all times.

## Overall Project Design Documentation (_Google Doc_)

The Overall Project Design Doc is intended to provide the developers and engineers with a hub to all high-level, project-wide design information and resources for the given project. The document should aim to include the following information:

-   Design System
    -   Layout grid and unit value
    -   Typographic grid
    -   Keylines
-   Global Resources
    -   Design mockups
    -   InVision prototype
    -   Living styleguide
    -   Icon assets

## Component / Feature Specific Design Documentation (with JIRA Tickets)

After story or feature tickets are created, the designer is then responsible for adding all related design notes including links to the InVision Prototype, `.psd` files, and any animation samples. Additional notes should be added with supporting screen shots when necessary. In addition each ticket should reference the overall design documentation _Google Doc_ so that any new developer has easy access to everything they need.

You can find out more about [writing design documentation](../design-documentation) later on.

## Accessibility

## What is accessible design?

By definition, an accessible product is one that can be used and consumed by all its users. Designing for accessibility means to make sure that what you’re designing is inclusive and usable by a diverse audience, regardless of disability.

## Why is it important?

[Accessibility statistics](http://www.interactiveaccessibility.com/accessibility-statistics) tell us that 18.7% of the U.S population, experience some type of disability. This includes physical impairments from affect the use of a touch device, cognitive impairments that may affect the ability to decipher meaning from visual elements and visual impairments such as color blindness that may cause the need to use contrast aids, screen readers and magnifiers.
Accessible design aids in creating a better experience not just for people with disability, but also for people without it. Designing this way makes better products, furthermore it is simply the right thing to do.

## How to design for accessibility

Mobify has developed a series of accessibility best practices from our extensive mobile interaction design experience. In general, accessibility should not be considered a checklist of rules-- it's a way of designing for people. Consider the following examples as you design the shopping experience:

### Use minimum tap targets
The size of a finger or thumb varies with age, gender and body shape. The ability to touch a particular area can also vary greatly (consider an elderly user with challenges in motor function). In order to make a product’s interface inclusive, a minimum tap target should be observed.
Industry standards for this can vary, but Mobify recommends a value no less than 44px square for all interactive elements. This is not to say that all tap-able elements should be this size, but rather the interactive element and spacing that separates interactions should be at least this value. This will not only help users interact with the UI, but ensure the correct element is tapped.

<figure class="u-text-align-center">
    <img src="images/taptarget-lancome.png" alt="Active and disabled states Lancome" />
    <figcaption>As seen in the Lancome navigation menu, each element regardless of size is spaced out using a minimum tap target, reducing the possibility of a user mistakenly tapping the wrong option.</figcaption>
</figure>

### Ensure sufficient colour contrast
A significant number of people have difficulties distinguishing certain shades and color combinations. Accessible color contrast between text and background is not only essential for an inclusive experience, Google’s Lighthouse tool is now penalizing sites that do not recognize a sufficient level of color contrasting.
There are multiple tools out there to help designers test contrast between foreground (text) and background color. [Check out this handy tool](http://contrastchecker.com) for testing contrast levels. Chrome also has colour contrasting built in to the dev tools.

<figure class="u-text-align-center">
    <img src="images/contrast-lighthouse.png" alt="Contrast checker and lighthouse checklist" />
    <figcaption>ContrastChecker.com offers useful tools for performing a11y checks on contrast. Lighthouse references this parameter in the outputted PWA score.</figcaption>
</figure>

### Don’t rely solely on color to provide distinction
Around 1 in 12 men and 1 in 200 women have some degree of colour vision deficiency. If a design relies solely on color to distinguish one element from another, these users will not be able to make that distinction.
An example of this is shown below; the size swatches utilize a coloured border to communicate the size a users has selected to purchase and a light grey tone to sizes that are out of stock. When this is presented to a user with a color vision deficiency, these variations are indistinguishable. An accessible way to approach this UI would be to increase the border thickness on the selected state and draw a line through the out of stock items.

<figure class="u-text-align-center">
    <img src="images/states-uikit.png" alt="Product Options UI Kit" />
    <figcaption>The product options example in the UI kit uses an increase in border width to denote active selections and strikethrough effect for out of stock options.</figcaption>
</figure>

### Back up icons with text
Users with sight deficiencies rely on screen readers to communicate the meaning of certain graphical elements. Ensuring alt text is present for all icons is essential coding practice. However, what about sighted users and their ability to decipher meaning from symbols? An accessible design is one that does not depend on its users understanding an icon in order to function. Always endeavor to back up graphical elements with text, use icons to visually enhance the interaction and make it more recognizable rather make the user question what it does.

<figure class="u-text-align-center">
    <img src="images/iconlabels-uikit.png" alt="Icon labels in the Ui Kit checkout" />
    <figcaption>The UI Kit demonstrates where labels are used with icons to explain unclear interactions. In the shopping cart design (left), the account icon is backed up with explanatory text 'Sign In' whereas the + and - icons in the quantity steppers are a much more familiar interaction.</figcaption>
</figure>

### Label form fields
Removing form labels in place of placeholder text is a common trait in ‘clean’ web design. However, this pattern will affect those using screen readers and negate their ability to understand the content required in that field.
Form labels are there to give context to the information entered before, during and after a user interacts with the form. As shown in the example below, a user going back to check a completed form without labels has no context as to what information has been entered where.
Placeholder text should be used for example content. This will further aid comprehension to those who might not understand what is required.

<figure class="u-text-align-center">
    <img src="images/formlabels-uikit.png" alt="The effect of not using form labels" />
    <figcaption>This example demonstrates how a completed form appears with and without form labels. If a user wishes to review the form on the left, there is no clear way to distinguish certain entries. Adding labels makes reviewing the form much clearer.</figcaption>
</figure>

### Provide clear error messaging
As well as providing clear instruction through form labels and placeholder text, error messaging should be designed, and inline validation utilized, to aid in the process of error recovery. Not all users will understand why their entry resulted in an “incorrect password” error. Understand the data required and deliver clear instruction for the user on inputting a valid entry (“Passwords are minimum 8 characters and contain at least one numeral”)

<figure class="u-text-align-center">
    <img src="images/errors-uikit.png" alt="Error messaging best practice" />
    <figcaption>This example shows two approaches to error handing on a form field. The more accessible solution on the right offers an additional indicator to the color change in the form of an error icon, as well as some contextual content as to how the user should resolve the error.</figcaption>
</figure>

## Using Real Content

Using real content  in your design is important, especially _difficult_ content-- products with long names, lots of variability, or quirky functions. The Mobify Platform allows designers to start work in a unique position: you have all the content you need, because it’s already live on the web. So take advantage of it!

<figure class="u-text-align-center">
	<img src="images/image-template.004.jpeg" alt="FUT Product List Page" />
	<figcaption>While an idealized visual design is aesthetically pleasing, you'll want to factor all possible scenarios into your design.</figcaption>
</figure>

Instead of shying away from difficult pieces of content, embrace them! Designing first for these worst case scenarios will ensure you’re addressing those problems early, and allowing sufficient time to resolve them as a part of your overall design. Upon resolving these ‘worst case scenarios’, you can then transfer that approach to a simpler product to make sure your solution scales.

Mobify PWAs work by leveraging existing content and business logic and transforming it for mobile, which means you will _rely heavily on desktop code_. In the past, designers were limited to creating the mobile experience with content and functionality that originated on desktop. This is evolving with our new Mobify PWAs. The lines separating mobile and desktop are beginning to blur, bringing new design possibilities.

We recommend that Mobify Platform designers start by understanding the desktop code, and base initial designs on the original desktop interactions. While Mobify’s frameworks enable new, sophisticated designs, we suggest balancing the new design possibilities with considerations about development time and page performance. To strike the right balance, consult with your engineering team when considering a solution that leverages Mobify's PWA technology.

## The prototyping process

With complex flows, interactions, and product customization, a flat mockup is not enough to communicate your vision. By creating a prototype, you can test to make sure the user's flow through the app is cohesive. The prototype can be large enough to encompass the entire flow, or it can be detailed, for a specific interaction. We recommend using a mix of both.

### Prototyping User Flow

**Our Recommended Tool:** [InVision](http://www.invisionapp.com/)

<figure class="u-text-align-center">
	<img src="images/image-template.001.jpeg" alt="Invision App" />
	<figcaption>Invision App allows you to create hotspots directly on your design that link to other pages</figcaption>
</figure>

Creating a simplified prototype out of your mockups is a great way to give the client a taste of how the site will look before you move into development. Not only is it a great way to make sure the flow is clear, it’s an excellent resource to share your designs with developers and clients alike.

InVision is the tool to do just that. (You will have seen an InVision prototype from our examples.) InVision lets you show page-to-page progression by linking flat mockup images together using hotspots. You can also include basic interactions using transitions and overlays.

### Prototyping Interaction

**Our Recommended Tools:** [Principle](http://principleformac.com/), [Framer](http://framerjs.com/), [Keynote](http://www.apple.com/mac/keynote/)

<figure class="u-text-align-center">
	<img src="images/principle-sample.gif" alt="Prototyping Interaction" />
	<figcaption>Principle is an excellent tool for communicating motion and microinteractions. You won't be able to design at this level of detail using tools such as Invision or Craft Protoype.</figcaption>
</figure>

Sometimes you need to show a little more detail on how something will work, like a specific animation for a design pattern. InVision’s animations are not the best tool to get those important details across.

Take the time to perfect those animations to make sure the intention is clear. With tools like Principle or Framer, you can fine-tune your animations to communicate the details with developers. Both of these apps will allow for fine adjustments of motion and timing.

## Every screen deserves special attention

Adapting to the needs of the platform is the only way to create optimal experiences for users.

<figure class="u-text-align-center">
    <img src="images/design.402.jpeg" alt="Acme Fashion Desktop and Mobile" />
</figure>

Mobify believes every screen deserves special attention. Every image asset on your desktop site deserves to have a supporting custom mobile asset to match. Sometimes the differences may just be the way the image is cropped. In other cases, a large landscape photo with overlaid typography will be transformed into a square image with supporting content below.

### Working With _HTML_ and Imagery

Working with both an image and HTML is what we would consider the "gold standard" — it produces the best results across all of your platforms. This approach involves using images for any graphic or photographic elements, and HTML text for any text-based content or interface elements, such as buttons.

This workflow allows you to manage a single code base and transform content to create the optimal user experience for a given screen size. This has a few benefits. Text and interface elements harmonize with existing site styles, allowing your content to appear consistent across screens. The user experience also benefits from improved accessibility as all headlines, supporting content, and call-to-actions are readable by screen readers. You also have the advantage that all content and links are readable by search engines.

### The Image-Only Approach

Many of our customers are not setup to support front-end development within their marketing teams, which rules out an image and HTML text approach. You can still create compelling mobile assets.

The image-only approach seeks to customize mobile assets to a precise standard. Text sizes fall above a minimum size, call-to-action buttons are suitably sized to make interaction easy, and images are cropped and sized in a way that makes them appealing on a small screen.

By implementing some simple standards you will be able to create and manage your promotional banners and get them live quickly. You will also have the flexibility to control your layouts as you see fit. You will, however, lose the accessibility and performance of a modular image and HTML approach. Some basic guidelines for creating a full-width mobile asset:

-   Assets that span the full width of a mobile device should be a minimum of `1300px` wide at `72dpi`. This will allow for images to display clearly on @2x and @3x devices.
-   Text should be no smaller than `40pts`.
-   Call-to-action buttons should a minimum of `132px` × `132px` and contain a clear call-to-action no smaller than `40pts`.

The easiest way to include mobile-specific assets is to add a unique attribute to the image tag, and add the mobile-specific asset URL as the value. We would recommend using attribute data-src.

```markup
<a href="/URL/to/promo" title="Shirt and Top Sale">
    <img
        alt="Shop Women"
        src="/URL/to/women/shirt-and-top-women.jpg"
        data-src="/URL/to/women/shirt-and-top-women--mobile.jpg" />
</a>
```

As most desktop images **do not** work well on mobile, we suggest you avoid using them, even if there is no mobile asset. In our example above, if the image tag does not have the data-src attribute, it will not be included on mobile.

## About Iconography

It is the designer’s responsibility to hand over icons to their team’s UI Developer.

Mobify uses the `.svg` format for iconography.

> The format decision comes down to browser support, primarily.
> This [CSS-Tricks article, Inline SVG vs Icon Fonts](https://css-tricks.com/icon-fonts-vs-svg/),
> offers a great side-by-side comparison of why `.svg` icons are far superior.)

### 1. Setting Up Your Icons

You'll want to make artboards uniform in size. In the project, icons will be relative to the Artboard size. Here (screenshot below) is an example of `.svg` icons in a project, with the artboard highlighted to show the relationship between artboard and icon.

<figure class="u-text-align-center">
    <img src="images/design.403.jpeg" alt="Icons design" />
</figure>

Typically, you will size your icon artboard according to your base font-size value — most likely `15px` or `16px`. You can position your icon anywhere within this artboard. There are many free-to-use icon libraries on the web — as long as the icon license allows for usage, you may use whichever icons you deem appropriate. Keep in mind the ecosystem you are designing for (iOS/Android/Web) and brand aesthetic.

### 2. Exporting Your Icons

In Sketch, a default `.svg` export is fine. Give it a descriptive name, such as `chevron.svg` or `heart.svg`. There is no need to prefix or suffix it, unless you are exporting different sizes. `.svg` files are fully scalable, so there is typically no need to export a small or large version.

### 3. Cleaning Up Your Icons

There is quite a bit of bloat that goes on inside a default export. You’ll want to remove that bloat, which you can do with an `.svg` file optimizer such as [SVGO](https://github.com/svg/svgo) or [SVGOMG](https://jakearchibald.github.io/svgomg/). Simply drag your `.svg` icons into the terminal window, and watch as they get crunched down. Note that any `.svg` files exported from Sketch will automatically be cleaned and optimized with SVGO.

Once compressed, you should open up the `.svg` file with a text editor. These files are simply vector images, created by calculating curves and shapes between points. It’s all code! That means you can optimize them further with a little manual tweaking. Within your text editor, change the `<title>...</title>` element to something descriptive, if it is not already. (i.e. Heart Icon.) You’ll also want to remove any `fill="..."` instance so that the icon can inherit a colour defined by your CSS. (An exception: if your icon uses multiple colours, like an illustration, keep the fill value, otherwise the colour will be lost and will inherit whatever the parent container’s colour is.)

You can now deliver these icons to your UI Developer, or dump them directly into a project yourself (typically in the `/static` folder) and let them know it is available for them to use.


<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>