Use the Shopper Experience API to look up page information for pages that are created in Page Designer.

Responses include the following:

- The entire component hierarchy of the page at design time.
- All merchant data provided at design time.
- Server-side scripting data provided at run time.

Both the page and components contain the values of all native and custom attributes that have been populated during page authoring.

Only visible pages are returned. Because the visibility of components is driven by rules (scheduling or customer groups, for example), these rules are subject to evaluation when assembling the component hierarchy in the response. Only components that are visible for the current customer context appear in the response. The same rules apply to the page itself, which is only be processed and returned if it is visible.

**Important**: Currently, the Shopper Experience API can’t be used when the [storefront password protection](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fpermissions%2Fb2c_storefront_password_protection.html&resultof=%22%73%74%6f%72%65%66%72%6f%6e%74%22%20%22%70%72%6f%74%65%63%74%69%6f%6e%22%20%22%70%72%6f%74%65%63%74%22%20) feature is enabled.
