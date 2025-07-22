export const pageTypes = {
  "_v": "1",
  "count": 3,
  "data": [
    {
      "attribute_definition_groups": [
        {
          "attribute_definitions": [
            {
              "dynamic_lookup": {
                "aspect_attribute_alias": "product"
              },
              "id": "product",
              "name": "Product",
              "required": true,
              "type": "product"
            }
          ],
          "description": "Product Detail Settings",
          "id": "productDetail",
          "name": "Product Detail Settings"
        }
      ],
      "description": "Product detail page with 3 regions",
      "id": "productDetail",
      "name": "Product Detail Page",
      "region_definitions": [
        {
          "id": "top",
          "name": "Top Region"
        },
        {
          "id": "main",
          "name": "Main Region"
        },
        {
          "id": "bottom",
          "name": "Bottom Region"
        }
      ],
      "supported_aspect_types": [
        {
          "attribute_definitions": [
            {
              "description": "The product to show the detail page for-",
              "id": "product",
              "name": "Product",
              "required": false,
              "type": "product"
            }
          ],
          "description": "A product detail page",
          "id": "pdp",
          "name": "Product detail page",
          "supported_object_types": [
            "category",
            "product"
          ]
        }
      ]
    },
    {
      "attribute_definition_groups": [
        {
          "attribute_definitions": [
            {
              "dynamic_lookup": {
                "aspect_attribute_alias": "category"
              },
              "id": "category",
              "name": "Category",
              "required": true,
              "type": "category"
            }
          ],
          "description": "Product List Settings",
          "id": "productList",
          "name": "Settings"
        }
      ],
      "description": "Product Listing Grid Layout",
      "id": "productList",
      "name": "Product List Page",
      "region_definitions": [
        {
          "id": "top",
          "name": "Top Region"
        },
        {
          "id": "main",
          "name": "Main Region"
        },
        {
          "id": "bottom",
          "name": "Bottom Region"
        }
      ],
      "supported_aspect_types": [
        {
          "attribute_definitions": [
            {
              "description": "The category to show the product list page for.",
              "id": "category",
              "name": "Category",
              "required": true,
              "type": "category"
            }
          ],
          "description": "A product list page.",
          "id": "plp",
          "name": "Product list page",
          "supported_object_types": [
            "category"
          ]
        }
      ]
    },
    {
      "description": "A storefront page",
      "id": "storePage",
      "name": "Storefront Page",
      "region_definitions": [
        {
          "id": "headerbanner",
          "max_components": 1,
          "name": "Header Banner Region"
        },
        {
          "id": "main",
          "name": "Main Region"
        },
        {
          "id": "legalnotice",
          "max_components": 1,
          "name": "Legal Notice Text"
        }
      ]
    }
  ],
  "total": 3
}
