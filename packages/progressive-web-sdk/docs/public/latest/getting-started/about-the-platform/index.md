The Mobify Platform is a Front-end as a Service for ecommerce. It includes:

- Software development kits (SDKs) to build shopping experiences using
  Progressive Web Apps (PWAs), Accelerated Mobile Pages (AMP pages), and native
  apps
- A scalable application delivery network to deploy those experiences, plus a
  web portal to manage them
- Integrations to simplify adding commerce, content management, and marketing
  technology systems to the front-end
- Analytics data to understand shoppers’ experiences

## What kind of PWA are you creating?

Depending on your project, there are two different approaches to creating a PWA
using the Mobify Platform: tag-loaded and server-side rendered. While much of
the setup is the same, some instructions will differ between the two types of
projects. Throughout this guide, we'll highlight when the instructions differ
for the two types of projects. In other guides, sometimes the content will only
be applicable to one type of project.

Let's compare the two types of projects...

### Tag-loaded projects

<div class="c-callout">
 <p>
   <strong>Note:</strong> The current regex inside of the Mobify tag allows iPad devices to render the mobile PWA experience on Facebook's embedded browser due to the user agent from iPad devices containing the word iPhone. If you don't wish to render the mobile PWA experience on iPad through Facebook's embedded browser, you'll need to ensure you check for that within your project.
 </p>
</div>

If you’re building a PWA that renders only on the client-side, without making
use of Mobify’s server-side rendering, you will be creating a tag-loaded project
using the Mobify tag. The Mobify tag is a snippet of HTML and JavaScript that
loads your PWA into an existing web page. This is typically used to give the PWA
experience only to mobile users.

If you’ve developed with the Mobify Platform in the past, you will likely be
familiar with the process of developing tag-loaded PWAs.

To learn more about tag-loaded PWAs, visit our [Architecture
overview](../../architecture/#1.-tag-loaded-pwas).

### Server-side rendered projects

<div class="c-callout">
  <p>
    <strong>What's a UPWA?</strong> In version 1.6 (Nov. 2018) of the Progressive Web SDK and earlier versions of our documentation, we referred to our server-side rendering technology as "Universal Progressive Web Apps" or "UPWAs". We’ve decided to stop using these names, so look for “server-side rendered” instead.
  </p>
</div>

If you’re developing a PWA that uses Mobify’s server-side rendering technology,
then the site can work across any device, including desktop screens, mobile
phones and tablets. This means you will _not_ be needing the Mobify tag. In a
server-side rendered PWA, your code will run on Mobify’s server and then again
in the browser, unlike a tag-loaded PWA, which only ever runs and renders in the
browser. Our server-side rendering technology was introduced to Mobify partners
in late 2018.

To learn more about server-side rendered PWAs, visit our [Architecture
overview](../../architecture/#2.-server-side-rendered-pwas).
