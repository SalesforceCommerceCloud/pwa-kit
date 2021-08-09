## Introduction

*Put Customers First. Be Exceptional. Own it.* These are Mobify’s core values, through everything we do. In our journey to deliver on these core values, we’ve developed some key policies that support our customers to build premium digital experiences. These include our shared responsibility model, our product release schedule, and key policies that detail our SDK support.

## Shared responsibility model

Mobify relies on a shared responsibility model with our customers to achieve security, compliance, reliability and performance. We each have different areas of responsibility for delivering a secure, reliable and performant system.

To help us define roles in the shared responsibility model, we use the words *application* and *platform*. We also use the words *Mobify* and *the customer* to clearly outline roles and responsibilities. We define these as follows:

- The *application* is the website or app, such as a Progressive Web App (PWA), that is deployed to and run on the Mobify Platform. Often, they are built by third parties, together with the customer’s technical team.

- The *platform* is the Mobify Platform. It includes Mobify’s Application Delivery Network and surrounding ecosystem, which deploys and runs applications. The platform also includes Mobify’s distributed SDKs, which are deployed as part of each application.

- *Mobify* is the organization that builds, maintains, and licenses the platform.

- The *customer* is the organization under contract with Mobify to license the platform and supporting services. The customer includes third parties, such as systems integrators or other agencies, who are acting on the customer’s behalf.

While Mobify is responsible for the platform, customers are responsible for the applications which run on the platform.

## Mobify’s responsibilities

Mobify is responsible for security, compliance, reliability and performance of **the platform**, across all customers. This includes:

**Security**

- Providing identity, authentication and authorization mechanisms to enable the security responsibilities of a deployed customer application.

- Ensuring the security of the platform by maintaining and updating the following on a regular basis: 
    - network and OS firewalls, 
    - network configurations, 
    - system and network encryption,
    - underlying operating systems and applications, and;
    - processes to monitor, log and test security concerns.

- Providing security updates addressing critical vulnerabilities to customers via regular updates of Mobify SDKs. Note that SDK updates are the responsibility of the customer to consume.

- Managing perimeter network security and intrusion detection.

- Ensuring physical data center and hardware security.

- Managing environment security.

**Compliance**

- Ensuring the platform remains PCI DSS compliant as a service provider, through processes to monitor, log and audit compliance concerns.

- Ensuring the platform provides the tools and processes to address customer privacy concerns.

**Reliability**

- Exceeding the service level guarantee across all customers through operational monitoring, incident management, and 24/7 enterprise-level support.

- Guaranteeing that the platform works as intended on supported devices, operating systems and browsers via regular updates of Mobify SDKs. Note that SDK updates are the responsibility of the customer to consume.

- Ensuring availability of infrastructure services across regions via monitoring, incident management and 24/7 infrastructure support.

**Performance**

- Ensuring the platform can service application requests in a timely manner to all end users through operational monitoring, ongoing load testing and regular updates to the platform.

- Providing performance updates addressing major performance concerns via regular updates of Mobify SDKs. These SDK updates are the responsibility of the customer to consume.

- Guaranteeing that the infrastructure can service platform requests in a timely manner.

## Customer responsibilities

Customers (and any third parties acting on their behalf) are responsible for the security, compliance, reliability and performance of **the application** which is deployed to the Mobify Platform. This includes:

**Security**

- Following front-end coding best practices, such as [OWASP](https://www.owasp.org/index.php/Main_Page), to provide a secure application.

- Secure management, storage and transfer of sensitive data, personally identifiable information and payment card data in backend systems.

- Undergoing regular security scanning and penetration testing.

- Keeping current with security updates and capabilities by updating Mobify SDKs and other project dependencies.

- Monitoring of potentially malicious application traffic and requests, and the related updating of web application firewall rules to secure endpoints.

- Managing Mobify user accounts on behalf of the organization, including access and permissions.
 

**Compliance**

- Managing and monitoring user and system access systems that interact with Mobify, such as source control and build systems.

- Auditing of custom application code, integrations and related processes to maintain PCI DSS certification as a merchant.

- Adhering and enforcing local regulations, including privacy.

**Reliability**

- Assuring that any custom application code and integrations with third party systems are built in a resilient manner. This means it behaves as expected without bugs, and it’s built defensively-- it attempts to function even when other systems fail. It also means ensuring that analytics are implemented correctly using the Mobify Platform's integrations SDKs.

- Ensuring any third party systems reliably provide necessary data and functionality to the deployed application(s) to behave as intended, such as stability of the provided API or datasource.

- Ensuring deployed application(s) behave as intended on devices, operating systems and browsers beyond the [list supported by Mobify](../compatibility/). 

- Providing operational management, incident management and support for any custom application code and third party integrations. For example, this could include ensuring that application errors are tracked in an appropriate system.
 

**Performance**

- Following front-end performance best practices as part of the deployed application. We’ve developed several documentation articles to guide you in this process:
    - [Best Practices for Improving Client Side Performance](../../progressive-web/latest/guides/client-side-performance/)
    - [Server-Side Rendering Performance Overview](../../progressive-web/latest/guides/ssr-performance-caching-overview/)
    - [Server-Side Rendering Performance: Using Mobify’s Application Cache](../../progressive-web/latest/guides/ssr-performance-application-cache/)
    - [Managing Performance](../../progressive-web/latest/guides/client-side-performance/)

- Ensuring integrations with third party systems are built in a performant manner.

- Undergoing regular performance and load testing.

- Configuring and monitoring cache controls to ensure healthy cache hit ratios. (See our documentation article on [CDN caching](../../progressive-web/latest/guides/ssr-performance-cdn-cache/).)

- Monitoring changes in performance based on synthetic and real user monitoring.

For advice on best practices in these areas, reach out to your Mobify point of contact.

## Product release schedule

Mobify releases a new version of SDKs every six weeks, for a total of eight releases a year. Releases contain new features and enhancements, bug fixes, security patches, and new documentation to support the development of applications on the platform. As part of the shared responsibility model, it’s the customer’s role to consume these updates, at a recommended minimum of 1-2 SDK upgrades per year.

In contrast to the SDK release schedule, the rest of the Mobify Platform (such as the Application Delivery Network) is continuously delivered. Enhancements are rolled out frequently outside of the SDK product release schedule. Generally, as these enhancements go live to the platform immediately, customers do not need to consume the updates. 

For more information about Mobify’s release process, read our documentation article on [Mobify Platform versions](../../progressive-web/latest/guides/mobify-platform-versions/). In addition, you can find detailed notes from each release since 2017 on our [Release Notes](../release-notes/) page.

## SDK support policies

As we continue to innovate and enhance our platform at a rapid pace, we’ve sought to clearly define our policies for early access, end of life, and upgrades.

### Early access

Mobify frequently releases early versions of enhancements, and aims to clearly mark them as early access. These enhancements are subject to changes in interface and/or functionality, and they may be removed from future releases as we receive early user feedback.

For early access features in Mobify’s SDKs, warnings will appear in the developer console anytime an experimental feature is used. For other early access features such as new user interface elements or APIs, Mobify will enable access to experimental features on a per-project basis.

Documentation articles covering early access features will be marked with a colorful tag, just like this:

<figure class="u-text-align-center">

  ![Early access tag](tag_early_access.png)

</figure>

### End of life

Customers on existing support contracts are entitled to bug fixes and updates to previous SDK versions, for a period of 24 months from the time of a given version’s General Availability release. This covers all SDKs.

### Upgrades

Mobify customers are encouraged to plan for a minimum of 1-2 SDK upgrades a year to keep current with fixes.



<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>