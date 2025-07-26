const componentMappings = {
    ProductView: [
        {name: 'product', type: 'object'},
        {name: 'isProductPartOfSet', type: 'bool'},
        {name: 'isProductPartOfBundle', type: 'bool'},
        {name: 'childOfBundleQuantity', type: 'number'},
        {name: 'category', type: 'array'},
        {name: 'isProductLoading', type: 'bool'},
        {name: 'isBasketLoading', type: 'bool'},
        {name: 'isWishlistLoading', type: 'bool'},
        {name: 'addToCart', type: 'func'},
        {name: 'addToWishlist', type: 'func'},
        {name: 'updateCart', type: 'func'},
        {name: 'updateWishlist', type: 'func'},
        {name: 'showFullLink', type: 'bool'},
        {name: 'imageSize', type: 'oneOf'},
        {name: 'childProductOrderability', type: 'object'},
        {name: 'setChildProductOrderability', type: 'func'},
        {name: 'onVariantSelected', type: 'func'},
        {name: 'validateOrderability', type: 'func'},
        {name: 'showImageGallery', type: 'bool'},
        {name: 'setSelectedBundleQuantity', type: 'func'},
        {name: 'selectedBundleParentQuantity', type: 'number'}
    ],
    ShopNowBar: [
        // No specific propTypes found, assuming no parameters
    ],
    ProductTile: [
        {name: 'product', type: 'shape'},
        {name: 'enableFavourite', type: 'bool'},
        {name: 'isFavourite', type: 'bool'},
        {name: 'onFavouriteToggle', type: 'func'},
        {name: 'imageViewType', type: 'string'},
        {name: 'selectableAttributeId', type: 'string'},
        {name: 'dynamicImageProps', type: 'object'},
        {name: 'badgeDetails', type: 'array'},
        {name: 'isRefreshingData', type: 'bool'}
    ],
    Hero: [
        {name: 'img', type: 'shape'},
        {name: 'title', type: 'string'},
        {name: 'actions', type: 'element'}
    ],
    Hero2: [
        // No specific propTypes found, assuming no parameters
    ],
    Header: [
        {name: 'children', type: 'node'},
        {name: 'onMenuClick', type: 'func'},
        {name: 'onLogoClick', type: 'func'},
        {name: 'onMyAccountClick', type: 'func'},
        {name: 'onWishlistClick', type: 'func'},
        {name: 'onMyCartClick', type: 'func'},
        {name: 'onStoreLocatorClick', type: 'func'},
        {name: 'searchInputRef', type: 'oneOfType'}
    ],
    Footer: [
        // No specific propTypes found, assuming no parameters
    ],
    Carousel2: [
        {name: 'items', type: 'arrayOf'},
        {name: 'interval', type: 'number'}
    ],
    ProductScroller: [
        {name: 'header', type: 'any'},
        {name: 'title', type: 'any'},
        {name: 'products', type: 'array'},
        {name: 'isLoading', type: 'bool'},
        {name: 'scrollProps', type: 'object'},
        {name: 'itemWidth', type: 'oneOfType'},
        {name: 'productTileProps', type: 'oneOfType'}
    ],
    Refinements: [
        {name: 'itemsBefore', type: 'arrayOf'},
        {name: 'filters', type: 'array'},
        {name: 'excludedFilters', type: 'arrayOf'},
        {name: 'toggleFilter', type: 'func'},
        {name: 'selectedFilters', type: 'object'},
        {name: 'isLoading', type: 'bool'}
    ],
    InformationAccordion: [
        {name: 'product', type: 'object'}
    ],
    LoginForm: [
        {name: 'submitForm', type: 'func'},
        {name: 'handleForgotPasswordClick', type: 'func'},
        {name: 'clickCreateAccount', type: 'func'},
        {name: 'handlePasswordlessLoginClick', type: 'func'},
        {name: 'form', type: 'object'},
        {name: 'isPasswordlessEnabled', type: 'bool'},
        {name: 'isSocialEnabled', type: 'bool'},
        {name: 'idps', type: 'arrayOf'},
        {name: 'setLoginType', type: 'func'}
    ],
    RegisterForm: [
        {name: 'submitForm', type: 'func'},
        {name: 'clickSignIn', type: 'func'},
        {name: 'form', type: 'object'}
    ],
    StoreLocatorContent: [
        // No specific propTypes found, assuming no parameters
    ],
    StoresList: [
        {name: 'storesInfo', type: 'array'}
    ],
    StoreLocatorInput: [
        {name: 'form', type: 'object'},
        {name: 'submitForm', type: 'func'}
    ],
    ProductItem: [
        {name: 'product', type: 'object'},
        {name: 'onItemQuantityChange', type: 'func'},
        {name: 'onAddItemToCart', type: 'func'},
        {name: 'showLoading', type: 'bool'},
        {name: 'isWishlistItem', type: 'bool'},
        {name: 'primaryAction', type: 'node'},
        {name: 'secondaryActions', type: 'node'}
    ],
    ShopCategory: [
        {name: 'categoryId', type: 'string'}
    ],
    CheckoutHeader: [
        // No specific propTypes found, assuming no parameters
    ],
    ContactInfo: [
        {name: 'isSocialEnabled', type: 'bool'},
        {name: 'isPasswordlessEnabled', type: 'bool'},
        {name: 'idps', type: 'array'}
    ],
    OrderSummary: [
        {name: 'basket', type: 'object'},
        {name: 'showPromoCodeForm', type: 'bool'},
        {name: 'showCartItems', type: 'bool'},
        {name: 'isEstimate', type: 'bool'},
        {name: 'fontSize', type: 'oneOf'}
    ],
    // Add more components and their parameters here
};

export default componentMappings; 