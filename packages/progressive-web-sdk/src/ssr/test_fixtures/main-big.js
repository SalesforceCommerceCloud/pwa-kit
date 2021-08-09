/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* global Progressive */
const rootEl = document.querySelectorAll('.react-target')[0]
rootEl.innerHTML = '<div class="pw-lockup">\n' +
    '    <div>\n' +
    '        <div id="app" class="t-app t-app--home" style="display: initial;">\n' +
    '            <div class="pw-dangerous-html">\n' +
    '                <div hidden=""></div>\n' +
    '            </div>\n' +
    '            <div aria-hidden="false">\n' +
    '                <div class="pw-skip-links"><a href="#app-main"\n' +
    '                                              class="pw-skip-links__anchor">Skip\n' +
    '                    to content</a><a href="#header-navigation"\n' +
    '                                     class="pw-skip-links__anchor">Skip to main\n' +
    '                    navigation</a><a href="#app-footer"\n' +
    '                                     class="pw-skip-links__anchor">Skip to\n' +
    '                    footer</a></div>\n' +
    '                <div id="app-wrap"\n' +
    '                     class="t-app__wrapper u-flexbox u-direction-column">\n' +
    '                    <div id="app-header" class="u-flex-none" role="banner">\n' +
    '                        <header class="t-header">\n' +
    '                            <div class="t-header__bar">\n' +
    '                                <div class="t-header__attic">\n' +
    '                                    <div class="t-header__max-width"><a\n' +
    '                                            class="pw-link t-header__attic-link"\n' +
    '                                            href="/customer/account/login/">Login</a><a\n' +
    '                                            href="/sales/guest/form/"\n' +
    '                                            class="pw-link t-header__attic-link">Orders\n' +
    '                                        &amp; Returns</a><a href="/contact/"\n' +
    '                                                            class="pw-link t-header__attic-link">Help</a>\n' +
    '                                    </div>\n' +
    '                                </div>\n' +
    '                                <div class="t-header__bar-wrapper">\n' +
    '                                    <div class="t-header__max-width">\n' +
    '                                        <div class="pw-header-bar">\n' +
    '                                            <div class="t-header-bar__title u-padding-start-lg">\n' +
    '                                                <div class="pw-header-bar__title">\n' +
    '                                                    <a class="pw-link t-header__link"\n' +
    '                                                       href="/">\n' +
    '                                                        <div class="pw-dangerous-html">\n' +
    '                                                            <div class="t-header__logo">\n' +
    '                                                                <svg width="67px"\n' +
    '                                                                     height="28px"\n' +
    '                                                                     viewBox="0 0 67 28"\n' +
    '                                                                     xmlns="http://www.w3.org/2000/svg">\n' +
    '                                                                    <g fill="currentColor"\n' +
    '                                                                       stroke="none"\n' +
    '                                                                       stroke-width="1"\n' +
    '                                                                       fill-rule="evenodd">\n' +
    '                                                                        <path d="M34.7020589,3.40472516 L34.7020589,27.4726323 L36.3999345,27.4726323 L36.3999345,0.38656317 L33.8531211,0.38656317 L28.2192613,24.3383871 L22.5468134,0.38656317 L20,0.38656317 L20,27.4726323 L21.5821113,27.4726323 L21.5821113,3.48211392 L27.2931473,27.4339379 L29.0681991,27.4339379 L34.7020589,3.40472516 Z M39.9252951,0.38656317 L39.9252951,27.4726323 L42.9351655,27.4726323 L42.9351655,16.7929822 L45.5977431,16.7929822 C49.8810201,16.7929822 51.8876003,14.5487079 51.8876003,10.2536312 L51.8876003,7.00330291 C51.8876003,2.90169816 50.0739605,0.38656317 45.8292716,0.38656317 L39.9252951,0.38656317 Z M42.9351655,14.0843753 L42.9351655,3.13386446 L45.8292716,3.13386446 C48.0287922,3.13386446 48.9163181,4.37208477 48.9163181,6.84852537 L48.9163181,10.4471031 C48.9163181,13.0396269 47.8358518,14.0843753 45.5977431,14.0843753 L42.9351655,14.0843753 Z"></path>\n' +
    '                                                                        <g id="logo-sparkle-1"\n' +
    '                                                                           transform="translate(50.000000, 1.000000)">\n' +
    '                                                                            <path d="M10.9295795,0.411803314 L12.33005,3.191019 L15.1093442,4.59156802 C15.4790697,4.77643076 15.6263638,5.22913665 15.4414226,5.59886214 C15.3662069,5.74772488 15.2470697,5.8605092 15.1093442,5.931019 L12.33005,7.33156802 L10.9295795,10.1107837 C10.7447951,10.4805092 10.2919324,10.6293719 9.92220691,10.4429406 C9.77342259,10.3677249 9.66063828,10.2486661 9.59012848,10.1107837 L8.19114808,7.33156802 L5.41177554,5.931019 C5.04205005,5.74458763 4.89483436,5.29337194 5.07977554,4.92364645 C5.15499122,4.77486214 5.27412848,4.66207782 5.41177554,4.59156802 L8.19114808,3.191019 L9.59012848,0.411803314 C9.77655985,0.0420778234 10.2277755,-0.105137863 10.597501,0.0797248822 C10.7462853,0.153371941 10.8591481,0.272430765 10.9295795,0.411803314 L10.9295795,0.411803314 L10.9295795,0.411803314 Z M11.1018932,4.08709743 L10.2604814,2.41705822 L9.41922652,4.08709743 C9.34871671,4.22497978 9.23585397,4.34403861 9.08706965,4.41925429 L7.41554024,5.2605092 L9.08706965,6.10341116 C9.22495201,6.17392096 9.34401083,6.28670527 9.41922652,6.43548959 L10.2604814,8.10709743 L11.1018932,6.43548959 C11.1723246,6.29760724 11.2851873,6.17854841 11.4338932,6.10341116 L13.105501,5.2605092 L11.4338932,4.41925429 C11.2961677,4.34874449 11.1771089,4.23596018 11.1018932,4.08709743 L11.1018932,4.08709743 Z"></path>\n' +
    '                                                                            <polygon\n' +
    '                                                                                    id="Shape"\n' +
    '                                                                                    points="7.72183784 21.0888649 4.63313514 21.0888649 4.63313514 18 3.0887027 18 3.0887027 21.0888649 0 21.0888649 0 22.6332973 3.0887027 22.6332973 3.0887027 25.7221622 4.63313514 25.7221622 4.63313514 22.6332973 7.72183784 22.6332973"></polygon>\n' +
    '                                                                            <polygon\n' +
    '                                                                                    id="Shape-Copy"\n' +
    '                                                                                    points="16.5211819 16.6881128 13.8332102 16.6881128 13.8332102 14 12.4891538 14 12.4891538 16.6881128 9.80118214 16.6881128 9.80118214 18.0321692 12.4891538 18.0321692 12.4891538 20.720282 13.8332102 20.720282 13.8332102 18.0321692 16.5211819 18.0321692"></polygon>\n' +
    '                                                                        </g>\n' +
    '                                                                        <g id="logo-sparkle-2"\n' +
    '                                                                           transform="translate(0.000000, 2.000000)">\n' +
    '                                                                            <path d="M5.92957946,8.41180331 L7.33005005,11.191019 L10.1093442,12.591568 C10.4790697,12.7764308 10.6263638,13.2291366 10.4414226,13.5988621 C10.3662069,13.7477249 10.2470697,13.8605092 10.1093442,13.931019 L7.33005005,15.331568 L5.92957946,18.1107837 C5.74479514,18.4805092 5.2919324,18.6293719 4.92220691,18.4429406 C4.77342259,18.3677249 4.66063828,18.2486661 4.59012848,18.1107837 L3.19114808,15.331568 L0.411775536,13.931019 C0.0420500456,13.7445876 -0.105165641,13.2933719 0.0797755358,12.9236465 C0.154991222,12.7748621 0.274128477,12.6620778 0.411775536,12.591568 L3.19114808,11.191019 L4.59012848,8.41180331 C4.77655985,8.04207782 5.22777554,7.89486214 5.59750103,8.07972488 C5.74628534,8.15337194 5.85914808,8.27243076 5.92957946,8.41180331 L5.92957946,8.41180331 L5.92957946,8.41180331 Z M6.10189318,12.0870974 L5.26048142,10.4170582 L4.41922652,12.0870974 C4.34871671,12.2249798 4.23585397,12.3440386 4.08706965,12.4192543 L2.41554024,13.2605092 L4.08706965,14.1034112 C4.22495201,14.173921 4.34401083,14.2867053 4.41922652,14.4354896 L5.26048142,16.1070974 L6.10189318,14.4354896 C6.17232456,14.2976072 6.2851873,14.1785484 6.43389318,14.1034112 L8.10550103,13.2605092 L6.43389318,12.4192543 C6.29616769,12.3487445 6.17710887,12.2359602 6.10189318,12.0870974 L6.10189318,12.0870974 Z"></path>\n' +
    '                                                                            <polygon\n' +
    '                                                                                    id="Shape-Copy-3"\n' +
    '                                                                                    points="16.7218378 3.08886486 13.6331351 3.08886486 13.6331351 0 12.0887027 0 12.0887027 3.08886486 9 3.08886486 9 4.6332973 12.0887027 4.6332973 12.0887027 7.72216216 13.6331351 7.72216216 13.6331351 4.6332973 16.7218378 4.6332973"></polygon>\n' +
    '                                                                            <polygon\n' +
    '                                                                                    id="Shape-Copy-4"\n' +
    '                                                                                    points="15.7199998 19.288096 13.4320239 19.288096 13.4320239 17 12.2879759 17 12.2879759 19.288096 10 19.288096 10 20.432144 12.2879759 20.432144 12.2879759 22.72024 13.4320239 22.72024 13.4320239 20.432144 15.7199998 20.432144"></polygon>\n' +
    '                                                                        </g>\n' +
    '                                                                    </g>\n' +
    '                                                                </svg>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <h1 class="u-visually-hidden">\n' +
    '                                                            Merlin\'s\n' +
    '                                                            Potions</h1></a>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                            <div class="t-header__grouped-actions">\n' +
    '                                                <div class="pw-search t-header__search"\n' +
    '                                                     role="search">\n' +
    '                                                    <div class="pw-search__inner">\n' +
    '                                                        <form class="pw-search__form"\n' +
    '                                                              action="javascript:void(0)">\n' +
    '                                                            <div class="pw-search__bar">\n' +
    '                                                                <div class="pw-search__icon pw--is-not-clickable">\n' +
    '                                                                    <svg aria-hidden="true"\n' +
    '                                                                         class="pw-icon pw-search__icon-content"\n' +
    '                                                                         title=""\n' +
    '                                                                         aria-labelledby="icon-3b96a7a4-7edc-42f3-bc02-72f88c32c937">\n' +
    '                                                                        <title id="icon-3b96a7a4-7edc-42f3-bc02-72f88c32c937"></title>\n' +
    '                                                                        <use role="presentation"\n' +
    '                                                                             xlink:href="#pw-search"></use>\n' +
    '                                                                    </svg>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-search__field">\n' +
    '                                                                    <label for="search-0"\n' +
    '                                                                           class="u-visually-hidden">Search</label><input\n' +
    '                                                                        type="search"\n' +
    '                                                                        class="pw-search__input"\n' +
    '                                                                        id="search-0"\n' +
    '                                                                        value=""\n' +
    '                                                                        name="query"\n' +
    '                                                                        data-analytics-name="search"\n' +
    '                                                                        placeholder="Search the entire store">\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-search__button-submit">\n' +
    '                                                                    <button disabled=""\n' +
    '                                                                            class="pw-button pw--secondary t-header__search-submit-button"\n' +
    '                                                                            data-analytics-name="search"\n' +
    '                                                                            type="submit">\n' +
    '                                                                        <div class="pw-button__inner">\n' +
    '                                                                            <svg role="img"\n' +
    '                                                                                 class="pw-icon"\n' +
    '                                                                                 title="Submit search"\n' +
    '                                                                                 aria-labelledby="icon-b520daf7-8f6c-410d-aa26-c1917103b2bb">\n' +
    '                                                                                <title id="icon-b520daf7-8f6c-410d-aa26-c1917103b2bb">\n' +
    '                                                                                    Submit\n' +
    '                                                                                    search</title>\n' +
    '                                                                                <use role="presentation"\n' +
    '                                                                                     xlink:href="#pw-search"></use>\n' +
    '                                                                            </svg>\n' +
    '                                                                        </div>\n' +
    '                                                                    </button>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </form>\n' +
    '                                                        <section\n' +
    '                                                                class="pw-search__suggestions pw--is-empty">\n' +
    '                                                            <div tabindex="0"></div>\n' +
    '                                                        </section>\n' +
    '                                                    </div>\n' +
    '                                                    <div tabindex="-1"\n' +
    '                                                         role="presentation"\n' +
    '                                                         class="pw-search__shade"></div>\n' +
    '                                                </div>\n' +
    '                                                <div class="pw-header-bar__actions t-header-bar__stores">\n' +
    '                                                    <a href="//locations.merlinspotions.com"\n' +
    '                                                       class="pw-link pw-button pw--anchor t-header__link"\n' +
    '                                                       data-analytics-name="show_store_locator">\n' +
    '                                                        <div class="pw-button__inner t-header__inner-button u-padding-0">\n' +
    '                                                            <div>\n' +
    '                                                                <div class="pw-icon-label">\n' +
    '                                                                    <div>\n' +
    '                                                                        <svg aria-hidden="true"\n' +
    '                                                                             class="pw-icon pw--medium"\n' +
    '                                                                             title=""\n' +
    '                                                                             aria-labelledby="icon-7a5b9cb0-1760-44a8-8941-7c10f14fd147">\n' +
    '                                                                            <title id="icon-7a5b9cb0-1760-44a8-8941-7c10f14fd147"></title>\n' +
    '                                                                            <use role="presentation"\n' +
    '                                                                                 xlink:href="#pw-map"></use>\n' +
    '                                                                        </svg>\n' +
    '                                                                        <span class="pw-icon-label__label">Stores</span>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                                <div class="pw-header-bar__actions t-header-bar__cart">\n' +
    '                                                    <button class="pw-button u-position-relative qa-header__cart"\n' +
    '                                                            data-analytics-name="show_mini_cart"\n' +
    '                                                            type="button">\n' +
    '                                                        <div class="pw-button__inner t-header__inner-button u-padding-0">\n' +
    '                                                            <div>\n' +
    '                                                                <div class="pw-icon-label">\n' +
    '                                                                    <div>\n' +
    '                                                                        <svg aria-hidden="true"\n' +
    '                                                                             class="pw-icon pw--medium"\n' +
    '                                                                             title=""\n' +
    '                                                                             aria-labelledby="icon-67f23aa2-b731-4a9c-a360-df9e5f995119">\n' +
    '                                                                            <title id="icon-67f23aa2-b731-4a9c-a360-df9e5f995119"></title>\n' +
    '                                                                            <use role="presentation"\n' +
    '                                                                                 xlink:href="#pw-cart"></use>\n' +
    '                                                                        </svg>\n' +
    '                                                                        <span class="pw-icon-label__label">Cart</span>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <p class="u-visually-hidden">\n' +
    '                                                                No items in the\n' +
    '                                                                cart.</p></div>\n' +
    '                                                    </button>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                        </div>\n' +
    '                                    </div>\n' +
    '                                </div>\n' +
    '                                <div class="t-header__mega-nav">\n' +
    '                                    <div class="t-header__max-width">\n' +
    '                                        <div class="c-mega-navigation">\n' +
    '                                            <nav class="pw-nav">\n' +
    '                                                <div role="list"\n' +
    '                                                     class="pw-mega-menu">\n' +
    '                                                    <div aria-level="0"\n' +
    '                                                         role="listitem"\n' +
    '                                                         class="pw-mega-menu-item pw--has-children pw--depth-0 pw--active">\n' +
    '                                                        <div class="pw-list-tile pw-mega-menu-item__content pw--has-children pw--depth-0 pw--active">\n' +
    '                                                            <div role="button"\n' +
    '                                                                 class="pw-list-tile__primary"\n' +
    '                                                                 tabindex="-1">\n' +
    '                                                                <div class="pw-list-tile__content">\n' +
    '                                                                    Root\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <div role="list"\n' +
    '                                                             class="pw-mega-menu-item__children pw--depth-0 pw--active"\n' +
    '                                                             aria-hidden="false"\n' +
    '                                                             aria-expanded="true">\n' +
    '                                                            <div aria-level="1"\n' +
    '                                                                 role="listitem"\n' +
    '                                                                 class="pw-mega-menu-item pw--depth-1">\n' +
    '                                                                <div class="pw-list-tile pw-mega-menu-item__content pw--depth-1">\n' +
    '                                                                    <div role="button"\n' +
    '                                                                         class="pw-list-tile__primary"\n' +
    '                                                                         tabindex="0">\n' +
    '                                                                        <div class="pw-list-tile__content">\n' +
    '                                                                            Potions\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <div aria-level="1"\n' +
    '                                                                 role="listitem"\n' +
    '                                                                 class="pw-mega-menu-item pw--depth-1">\n' +
    '                                                                <div class="pw-list-tile pw-mega-menu-item__content pw--depth-1">\n' +
    '                                                                    <div role="button"\n' +
    '                                                                         class="pw-list-tile__primary"\n' +
    '                                                                         tabindex="0">\n' +
    '                                                                        <div class="pw-list-tile__content">\n' +
    '                                                                            Books\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <div aria-level="1"\n' +
    '                                                                 role="listitem"\n' +
    '                                                                 class="pw-mega-menu-item pw--depth-1">\n' +
    '                                                                <div class="pw-list-tile pw-mega-menu-item__content pw--depth-1">\n' +
    '                                                                    <div role="button"\n' +
    '                                                                         class="pw-list-tile__primary"\n' +
    '                                                                         tabindex="0">\n' +
    '                                                                        <div class="pw-list-tile__content">\n' +
    '                                                                            Ingredients\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <div aria-level="1"\n' +
    '                                                                 role="listitem"\n' +
    '                                                                 class="pw-mega-menu-item pw--depth-1">\n' +
    '                                                                <div class="pw-list-tile pw-mega-menu-item__content pw--depth-1">\n' +
    '                                                                    <div role="button"\n' +
    '                                                                         class="pw-list-tile__primary"\n' +
    '                                                                         tabindex="0">\n' +
    '                                                                        <div class="pw-list-tile__content">\n' +
    '                                                                            Supplies\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <div aria-level="1"\n' +
    '                                                                 role="listitem"\n' +
    '                                                                 class="pw-mega-menu-item pw--depth-1">\n' +
    '                                                                <div class="pw-list-tile pw-mega-menu-item__content pw--depth-1">\n' +
    '                                                                    <div role="button"\n' +
    '                                                                         class="pw-list-tile__primary"\n' +
    '                                                                         tabindex="0">\n' +
    '                                                                        <div class="pw-list-tile__content">\n' +
    '                                                                            Charms\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <div aria-level="1"\n' +
    '                                                                 role="listitem"\n' +
    '                                                                 class="pw-mega-menu-item pw--depth-1">\n' +
    '                                                                <div class="pw-list-tile pw-mega-menu-item__content pw--depth-1">\n' +
    '                                                                    <div role="button"\n' +
    '                                                                         class="pw-list-tile__primary"\n' +
    '                                                                         tabindex="0">\n' +
    '                                                                        <div class="pw-list-tile__content">\n' +
    '                                                                            New\n' +
    '                                                                            Arrivals\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <div aria-level="1"\n' +
    '                                                                 role="listitem"\n' +
    '                                                                 class="pw-mega-menu-item pw--depth-1">\n' +
    '                                                                <div class="pw-list-tile pw-mega-menu-item__content pw--depth-1">\n' +
    '                                                                    <div role="button"\n' +
    '                                                                         class="pw-list-tile__primary"\n' +
    '                                                                         tabindex="0">\n' +
    '                                                                        <div class="pw-list-tile__content">\n' +
    '                                                                            Starters\n' +
    '                                                                            Kit\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </nav>\n' +
    '                                        </div>\n' +
    '                                    </div>\n' +
    '                                </div>\n' +
    '                            </div>\n' +
    '                        </header>\n' +
    '                        <div class="c-notification-manager u-padding-top-md u-padding-bottom-md u-padding-start u-padding-end"></div>\n' +
    '                    </div>\n' +
    '                    <div class="u-flexbox u-flex u-direction-column">\n' +
    '                        <main id="app-main" class="t-app__main u-flex"\n' +
    '                              role="main">\n' +
    '                            <div class="t-home__container">\n' +
    '                                <div class="t-home__carousel">\n' +
    '                                    <div class="pw-carousel pw--side-controls pw--side-controls-with-tight-space">\n' +
    '                                        <div class="pw-carousel__inner"\n' +
    '                                             style="transform: translate3d(0, 0, 0);">\n' +
    '                                            <div class="pw-carousel__item"\n' +
    '                                                 aria-hidden="true"\n' +
    '                                                 aria-live="">\n' +
    '                                                <div style="display: none;">\n' +
    '                                                    <div class="pw-image u-display-block">\n' +
    '                                                        <span><span><div\n' +
    '                                                                class="pw-ratio"><div\n' +
    '                                                                class="pw-ratio__fill"\n' +
    '                                                                style="padding-bottom: 41.640625%;"></div><div\n' +
    '                                                                class="pw-ratio__inner"><div\n' +
    '                                                                width="4000px"\n' +
    '                                                                height="2490px"\n' +
    '                                                                style="height: 2490px; width: 4000px;"\n' +
    '                                                                type="div"\n' +
    '                                                                role="presentation"\n' +
    '                                                                class="pw-skeleton-block"></div></div></div></span><img\n' +
    '                                                                class="pw-image__tag u-visually-hidden"\n' +
    '                                                                alt=""\n' +
    '                                                                height="auto"\n' +
    '                                                                width="100%"\n' +
    '                                                                draggable="auto"\n' +
    '                                                                src="/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE.png?b5ffb243"\n' +
    '                                                                srcset="/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE.png?b5ffb243,/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE@2x.png?b5ffb243 2x"></span>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__item pw--active"\n' +
    '                                                 aria-hidden="false"\n' +
    '                                                 aria-live="polite">\n' +
    '                                                <div style="display: block;">\n' +
    '                                                    <div class="pw-image u-display-block">\n' +
    '                                                        <span><span><div\n' +
    '                                                                class="pw-ratio"><div\n' +
    '                                                                class="pw-ratio__fill"\n' +
    '                                                                style="padding-bottom: 41.640625%;"></div><div\n' +
    '                                                                class="pw-ratio__inner"><div\n' +
    '                                                                width="4000px"\n' +
    '                                                                height="2490px"\n' +
    '                                                                style="height: 2490px; width: 4000px;"\n' +
    '                                                                type="div"\n' +
    '                                                                role="presentation"\n' +
    '                                                                class="pw-skeleton-block"></div></div></div></span><img\n' +
    '                                                                class="pw-image__tag u-visually-hidden"\n' +
    '                                                                alt=""\n' +
    '                                                                height="auto"\n' +
    '                                                                width="100%"\n' +
    '                                                                draggable="auto"\n' +
    '                                                                src="/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE.png?b5ffb243"\n' +
    '                                                                srcset="/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE.png?b5ffb243,/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE@2x.png?b5ffb243 2x"></span>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__item"\n' +
    '                                                 aria-hidden="true"\n' +
    '                                                 aria-live="">\n' +
    '                                                <div style="display: none;">\n' +
    '                                                    <div class="pw-image u-display-block">\n' +
    '                                                        <span><span><div\n' +
    '                                                                class="pw-ratio"><div\n' +
    '                                                                class="pw-ratio__fill"\n' +
    '                                                                style="padding-bottom: 41.640625%;"></div><div\n' +
    '                                                                class="pw-ratio__inner"><div\n' +
    '                                                                width="4000px"\n' +
    '                                                                height="2490px"\n' +
    '                                                                style="height: 2490px; width: 4000px;"\n' +
    '                                                                type="div"\n' +
    '                                                                role="presentation"\n' +
    '                                                                class="pw-skeleton-block"></div></div></div></span><img\n' +
    '                                                                class="pw-image__tag u-visually-hidden"\n' +
    '                                                                alt=""\n' +
    '                                                                height="auto"\n' +
    '                                                                width="100%"\n' +
    '                                                                draggable="auto"\n' +
    '                                                                src="/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE.png?b5ffb243"\n' +
    '                                                                srcset="/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE.png?b5ffb243,/mobify/bundle/1041/static/img/homepage_carousel/promo-LARGE@2x.png?b5ffb243 2x"></span>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                        </div>\n' +
    '                                        <div class="pw-carousel__controls">\n' +
    '                                            <div class="pw-carousel__previous">\n' +
    '                                                <button class="pw-button"\n' +
    '                                                        data-analytics-name="carousel"\n' +
    '                                                        data-analytics-content="previous"\n' +
    '                                                        type="button">\n' +
    '                                                    <div class="pw-button__inner">\n' +
    '                                                        <svg role="img"\n' +
    '                                                             class="pw-icon"\n' +
    '                                                             title="Show slide 4 of 4"\n' +
    '                                                             aria-labelledby="icon-b7536465-80fd-4017-a8ca-728d164954af">\n' +
    '                                                            <title id="icon-b7536465-80fd-4017-a8ca-728d164954af">\n' +
    '                                                                Show slide 4 of\n' +
    '                                                                4</title>\n' +
    '                                                            <use role="presentation"\n' +
    '                                                                 xlink:href="#pw-chevron-left"></use>\n' +
    '                                                        </svg>\n' +
    '                                                    </div>\n' +
    '                                                </button>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__pips">\n' +
    '                                                <div class="pw-carousel__pip pw--active">\n' +
    '                                                    <span class="u-visually-hidden">Current slide: 1</span>\n' +
    '                                                </div>\n' +
    '                                                <div class="pw-carousel__pip">\n' +
    '                                                    <span class="u-visually-hidden">Slide 2</span>\n' +
    '                                                </div>\n' +
    '                                                <div class="pw-carousel__pip">\n' +
    '                                                    <span class="u-visually-hidden">Slide 3</span>\n' +
    '                                                </div>\n' +
    '                                                <div class="pw-carousel__pip">\n' +
    '                                                    <span class="u-visually-hidden">Slide 4</span>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__next">\n' +
    '                                                <button class="pw-button"\n' +
    '                                                        data-analytics-name="carousel"\n' +
    '                                                        data-analytics-content="next"\n' +
    '                                                        type="button">\n' +
    '                                                    <div class="pw-button__inner">\n' +
    '                                                        <svg role="img"\n' +
    '                                                             class="pw-icon"\n' +
    '                                                             title="Show slide 2 of 4"\n' +
    '                                                             aria-labelledby="icon-018cda4f-b2ed-42fd-ad79-484e5379c903">\n' +
    '                                                            <title id="icon-018cda4f-b2ed-42fd-ad79-484e5379c903">\n' +
    '                                                                Show slide 2 of\n' +
    '                                                                4</title>\n' +
    '                                                            <use role="presentation"\n' +
    '                                                                 xlink:href="#pw-chevron-right"></use>\n' +
    '                                                        </svg>\n' +
    '                                                    </div>\n' +
    '                                                </button>\n' +
    '                                            </div>\n' +
    '                                        </div>\n' +
    '                                    </div>\n' +
    '                                </div>\n' +
    '                                <article class="c-card">\n' +
    '                                    <div class="c-card__inner">\n' +
    '                                        <div class="c-card__content">\n' +
    '                                            <div class="t-home__category u-padding-start-lg u-padding-end-lg">\n' +
    '                                                <a class="pw-link pw-button pw--anchor t-home__category-item u-padding-bottom-lg"\n' +
    '                                                   href="/potions.html">\n' +
    '                                                    <div class="pw-button__inner">\n' +
    '                                                        <div class="u-flex">\n' +
    '                                                            <div class="c-lazy-load-content u-text-align-center">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <span><span><div\n' +
    '                                                                            type="div"\n' +
    '                                                                            class="pw-skeleton-block pw--image"\n' +
    '                                                                            style="height: 60px; width: 60px;"\n' +
    '                                                                            height="auto"\n' +
    '                                                                            width="100%"\n' +
    '                                                                            role="presentation"></div></span><img\n' +
    '                                                                            class="pw-image__tag u-visually-hidden"\n' +
    '                                                                            alt="Potions"\n' +
    '                                                                            height="60px"\n' +
    '                                                                            width="60px"\n' +
    '                                                                            draggable="auto"\n' +
    '                                                                            src="/mobify/bundle/1041/static/img/categories/potions@2x.png?e09606a6"></span>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                            <div class="t-home__category-text u-text-align-center">\n' +
    '                                                                Potions\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </a><a\n' +
    '                                                    class="pw-link pw-button pw--anchor t-home__category-item u-padding-bottom-lg"\n' +
    '                                                    href="/books.html">\n' +
    '                                                <div class="pw-button__inner">\n' +
    '                                                    <div class="u-flex">\n' +
    '                                                        <div class="c-lazy-load-content u-text-align-center">\n' +
    '                                                            <div class="pw-image">\n' +
    '                                                                <span><span><div\n' +
    '                                                                        type="div"\n' +
    '                                                                        class="pw-skeleton-block pw--image"\n' +
    '                                                                        style="height: 60px; width: 60px;"\n' +
    '                                                                        height="auto"\n' +
    '                                                                        width="100%"\n' +
    '                                                                        role="presentation"></div></span><img\n' +
    '                                                                        class="pw-image__tag u-visually-hidden"\n' +
    '                                                                        alt="Books"\n' +
    '                                                                        height="60px"\n' +
    '                                                                        width="60px"\n' +
    '                                                                        draggable="auto"\n' +
    '                                                                        src="/mobify/bundle/1041/static/img/categories/books@2x.png?c83d234d"></span>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <div class="t-home__category-text u-text-align-center">\n' +
    '                                                            Books\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </a><a class="pw-link pw-button pw--anchor t-home__category-item u-padding-bottom-lg"\n' +
    '                                                   href="/ingredients.html">\n' +
    '                                                <div class="pw-button__inner">\n' +
    '                                                    <div class="u-flex">\n' +
    '                                                        <div class="c-lazy-load-content u-text-align-center">\n' +
    '                                                            <div class="pw-image">\n' +
    '                                                                <span><span><div\n' +
    '                                                                        type="div"\n' +
    '                                                                        class="pw-skeleton-block pw--image"\n' +
    '                                                                        style="height: 60px; width: 60px;"\n' +
    '                                                                        height="auto"\n' +
    '                                                                        width="100%"\n' +
    '                                                                        role="presentation"></div></span><img\n' +
    '                                                                        class="pw-image__tag u-visually-hidden"\n' +
    '                                                                        alt="Ingredients"\n' +
    '                                                                        height="60px"\n' +
    '                                                                        width="60px"\n' +
    '                                                                        draggable="auto"\n' +
    '                                                                        src="/mobify/bundle/1041/static/img/categories/ingredients@2x.png?3d1b2525"></span>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <div class="t-home__category-text u-text-align-center">\n' +
    '                                                            Ingredients\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </a><a class="pw-link pw-button pw--anchor t-home__category-item u-padding-bottom-lg"\n' +
    '                                                   href="/supplies.html">\n' +
    '                                                <div class="pw-button__inner">\n' +
    '                                                    <div class="u-flex">\n' +
    '                                                        <div class="c-lazy-load-content u-text-align-center">\n' +
    '                                                            <div class="pw-image">\n' +
    '                                                                <span><span><div\n' +
    '                                                                        type="div"\n' +
    '                                                                        class="pw-skeleton-block pw--image"\n' +
    '                                                                        style="height: 60px; width: 60px;"\n' +
    '                                                                        height="auto"\n' +
    '                                                                        width="100%"\n' +
    '                                                                        role="presentation"></div></span><img\n' +
    '                                                                        class="pw-image__tag u-visually-hidden"\n' +
    '                                                                        alt="Supplies"\n' +
    '                                                                        height="60px"\n' +
    '                                                                        width="60px"\n' +
    '                                                                        draggable="auto"\n' +
    '                                                                        src="/mobify/bundle/1041/static/img/categories/supplies@2x.png?4939e3c9"></span>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <div class="t-home__category-text u-text-align-center">\n' +
    '                                                            Supplies\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </a><a class="pw-link pw-button pw--anchor t-home__category-item u-padding-bottom-lg"\n' +
    '                                                   href="/charms.html">\n' +
    '                                                <div class="pw-button__inner">\n' +
    '                                                    <div class="u-flex">\n' +
    '                                                        <div class="c-lazy-load-content u-text-align-center">\n' +
    '                                                            <div class="pw-image">\n' +
    '                                                                <span><span><div\n' +
    '                                                                        type="div"\n' +
    '                                                                        class="pw-skeleton-block pw--image"\n' +
    '                                                                        style="height: 60px; width: 60px;"\n' +
    '                                                                        height="auto"\n' +
    '                                                                        width="100%"\n' +
    '                                                                        role="presentation"></div></span><img\n' +
    '                                                                        class="pw-image__tag u-visually-hidden"\n' +
    '                                                                        alt="Charms"\n' +
    '                                                                        height="60px"\n' +
    '                                                                        width="60px"\n' +
    '                                                                        draggable="auto"\n' +
    '                                                                        src="/mobify/bundle/1041/static/img/categories/charms@2x.png?0e02073b"></span>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <div class="t-home__category-text u-text-align-center">\n' +
    '                                                            Charms\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </a><a class="pw-link pw-button pw--anchor t-home__category-item u-padding-bottom-lg"\n' +
    '                                                   href="/new-arrivals.html">\n' +
    '                                                <div class="pw-button__inner">\n' +
    '                                                    <div class="u-flex">\n' +
    '                                                        <div class="c-lazy-load-content u-text-align-center">\n' +
    '                                                            <div class="pw-image">\n' +
    '                                                                <span><span><div\n' +
    '                                                                        type="div"\n' +
    '                                                                        class="pw-skeleton-block pw--image"\n' +
    '                                                                        style="height: 60px; width: 60px;"\n' +
    '                                                                        height="auto"\n' +
    '                                                                        width="100%"\n' +
    '                                                                        role="presentation"></div></span><img\n' +
    '                                                                        class="pw-image__tag u-visually-hidden"\n' +
    '                                                                        alt="New Arrivals"\n' +
    '                                                                        height="60px"\n' +
    '                                                                        width="60px"\n' +
    '                                                                        draggable="auto"\n' +
    '                                                                        src="/mobify/bundle/1041/static/img/categories/new-arrivals@2x.png?d80534b5"></span>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <div class="t-home__category-text u-text-align-center">\n' +
    '                                                            New Arrivals\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </a></div>\n' +
    '                                        </div>\n' +
    '                                    </div>\n' +
    '                                </article>\n' +
    '                                <div class="t-home__popular-items">\n' +
    '                                    <div class="u-margin-bottom-md u-padding-start-md u-padding-end-md u-flexbox u-align-center">\n' +
    '                                        <h2 class="u-h4 u-padding-top-lg">New in\n' +
    '                                            Category</h2></div>\n' +
    '                                    <div class="pw-carousel pw--side-controls pw--side-controls-with-tight-space">\n' +
    '                                        <div class="pw-carousel__inner"\n' +
    '                                             style="transform: translate3d(0, 0, 0);">\n' +
    '                                            <div class="pw-carousel__item"\n' +
    '                                                 aria-hidden="true"\n' +
    '                                                 aria-live="">\n' +
    '                                                <div style="display: none;">\n' +
    '                                                    <div class="u-text-height-single u-flexbox u-text-height-base u-text-align-start">\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/sleeping-draught.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Sleeping Draught"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/s/l/sleeping-draught-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/sleeping-draught.html">Sleeping\n' +
    '                                                                                Draught</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$24.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/polyjuice-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Polyjuice Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/polyjuice-potion-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/polyjuice-potion.html">Polyjuice\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$35.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/love-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Love Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/o/love-potion-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/love-potion.html">Love\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$6.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/dragon-tonic.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Dragon Tonic"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/d/r/dragon-tonic-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/dragon-tonic.html">Dragon\n' +
    '                                                                                Tonic</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$60.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/aging-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Aging Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/a/g/aging-potion-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/aging-potion.html">Aging\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$25.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/unicorn-blood.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Unicorn Blood Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/u/n/unicorn-blood-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/unicorn-blood.html">Unicorn\n' +
    '                                                                                Blood</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$14.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__item pw--active"\n' +
    '                                                 aria-hidden="false"\n' +
    '                                                 aria-live="polite">\n' +
    '                                                <div style="display: block;">\n' +
    '                                                    <div class="u-text-height-single u-flexbox u-text-height-base u-text-align-start">\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/eye-of-newt.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Eye of Newt Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/e/y/eye-of-newt-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/eye-of-newt.html">Eye\n' +
    '                                                                                Of\n' +
    '                                                                                Newt</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                    <div class="pw-rating pw-tile__rating-stars pw--solid">\n' +
    '                                                                        <div class="pw-rating__label">\n' +
    '                                                                            Rating\n' +
    '                                                                            is 5\n' +
    '                                                                            out\n' +
    '                                                                            of 5\n' +
    '                                                                        </div>\n' +
    '                                                                        <div class="pw-rating__icon-wrapper"\n' +
    '                                                                             role="presentation"\n' +
    '                                                                             aria-hidden="true">\n' +
    '                                                                            <div class="pw-rating__filled-icons"\n' +
    '                                                                                 style="width: 100%;">\n' +
    '                                                                                <div class="pw-rating__icon pw--filled">\n' +
    '                                                                                    <svg aria-hidden="true"\n' +
    '                                                                                         class="pw-icon"\n' +
    '                                                                                         title=""\n' +
    '                                                                                         aria-labelledby="icon-9e911a42-e295-499d-86cd-4519d5720aa5">\n' +
    '                                                                                        <title id="icon-9e911a42-e295-499d-86cd-4519d5720aa5"></title>\n' +
    '                                                                                        <use role="presentation"\n' +
    '                                                                                             xlink:href="#pw-star"></use>\n' +
    '                                                                                    </svg>\n' +
    '                                                                                </div>\n' +
    '                                                                                <div class="pw-rating__icon pw--filled">\n' +
    '                                                                                    <svg aria-hidden="true"\n' +
    '                                                                                         class="pw-icon"\n' +
    '                                                                                         title=""\n' +
    '                                                                                         aria-labelledby="icon-a6651982-9f44-4047-881f-72dcf87a681b">\n' +
    '                                                                                        <title id="icon-a6651982-9f44-4047-881f-72dcf87a681b"></title>\n' +
    '                                                                                        <use role="presentation"\n' +
    '                                                                                             xlink:href="#pw-star"></use>\n' +
    '                                                                                    </svg>\n' +
    '                                                                                </div>\n' +
    '                                                                                <div class="pw-rating__icon pw--filled">\n' +
    '                                                                                    <svg aria-hidden="true"\n' +
    '                                                                                         class="pw-icon"\n' +
    '                                                                                         title=""\n' +
    '                                                                                         aria-labelledby="icon-8ec63232-0d75-48d2-a845-9a46e2cc351b">\n' +
    '                                                                                        <title id="icon-8ec63232-0d75-48d2-a845-9a46e2cc351b"></title>\n' +
    '                                                                                        <use role="presentation"\n' +
    '                                                                                             xlink:href="#pw-star"></use>\n' +
    '                                                                                    </svg>\n' +
    '                                                                                </div>\n' +
    '                                                                                <div class="pw-rating__icon pw--filled">\n' +
    '                                                                                    <svg aria-hidden="true"\n' +
    '                                                                                         class="pw-icon"\n' +
    '                                                                                         title=""\n' +
    '                                                                                         aria-labelledby="icon-28f09079-bc0f-4e4e-a7b3-cc5a7269ea91">\n' +
    '                                                                                        <title id="icon-28f09079-bc0f-4e4e-a7b3-cc5a7269ea91"></title>\n' +
    '                                                                                        <use role="presentation"\n' +
    '                                                                                             xlink:href="#pw-star"></use>\n' +
    '                                                                                    </svg>\n' +
    '                                                                                </div>\n' +
    '                                                                                <div class="pw-rating__icon pw--filled">\n' +
    '                                                                                    <svg aria-hidden="true"\n' +
    '                                                                                         class="pw-icon"\n' +
    '                                                                                         title=""\n' +
    '                                                                                         aria-labelledby="icon-e606ec1a-5ed1-4aa8-85f1-5c9f063e398d">\n' +
    '                                                                                        <title id="icon-e606ec1a-5ed1-4aa8-85f1-5c9f063e398d"></title>\n' +
    '                                                                                        <use role="presentation"\n' +
    '                                                                                             xlink:href="#pw-star"></use>\n' +
    '                                                                                    </svg>\n' +
    '                                                                                </div>\n' +
    '                                                                            </div>\n' +
    '                                                                            <div class="pw-rating__icon">\n' +
    '                                                                                <svg aria-hidden="true"\n' +
    '                                                                                     class="pw-icon"\n' +
    '                                                                                     title=""\n' +
    '                                                                                     aria-labelledby="icon-1cc21358-eb78-484f-b0b8-fbe0c5e4a1ca">\n' +
    '                                                                                    <title id="icon-1cc21358-eb78-484f-b0b8-fbe0c5e4a1ca"></title>\n' +
    '                                                                                    <use role="presentation"\n' +
    '                                                                                         xlink:href="#pw-star"></use>\n' +
    '                                                                                </svg>\n' +
    '                                                                            </div>\n' +
    '                                                                            <div class="pw-rating__icon">\n' +
    '                                                                                <svg aria-hidden="true"\n' +
    '                                                                                     class="pw-icon"\n' +
    '                                                                                     title=""\n' +
    '                                                                                     aria-labelledby="icon-ad302334-50b0-4191-8937-46b58f3ce213">\n' +
    '                                                                                    <title id="icon-ad302334-50b0-4191-8937-46b58f3ce213"></title>\n' +
    '                                                                                    <use role="presentation"\n' +
    '                                                                                         xlink:href="#pw-star"></use>\n' +
    '                                                                                </svg>\n' +
    '                                                                            </div>\n' +
    '                                                                            <div class="pw-rating__icon">\n' +
    '                                                                                <svg aria-hidden="true"\n' +
    '                                                                                     class="pw-icon"\n' +
    '                                                                                     title=""\n' +
    '                                                                                     aria-labelledby="icon-aedaea31-de93-4c7e-a41f-c767bebf9c06">\n' +
    '                                                                                    <title id="icon-aedaea31-de93-4c7e-a41f-c767bebf9c06"></title>\n' +
    '                                                                                    <use role="presentation"\n' +
    '                                                                                         xlink:href="#pw-star"></use>\n' +
    '                                                                                </svg>\n' +
    '                                                                            </div>\n' +
    '                                                                            <div class="pw-rating__icon">\n' +
    '                                                                                <svg aria-hidden="true"\n' +
    '                                                                                     class="pw-icon"\n' +
    '                                                                                     title=""\n' +
    '                                                                                     aria-labelledby="icon-1f1c00b8-bdf5-4004-bc44-046199504197">\n' +
    '                                                                                    <title id="icon-1f1c00b8-bdf5-4004-bc44-046199504197"></title>\n' +
    '                                                                                    <use role="presentation"\n' +
    '                                                                                         xlink:href="#pw-star"></use>\n' +
    '                                                                                </svg>\n' +
    '                                                                            </div>\n' +
    '                                                                            <div class="pw-rating__icon">\n' +
    '                                                                                <svg aria-hidden="true"\n' +
    '                                                                                     class="pw-icon"\n' +
    '                                                                                     title=""\n' +
    '                                                                                     aria-labelledby="icon-d69a2185-87e7-4faf-97de-3ab9d0ea7416">\n' +
    '                                                                                    <title id="icon-d69a2185-87e7-4faf-97de-3ab9d0ea7416"></title>\n' +
    '                                                                                    <use role="presentation"\n' +
    '                                                                                         xlink:href="#pw-star"></use>\n' +
    '                                                                                </svg>\n' +
    '                                                                            </div>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$12.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/growth-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Growth Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/g/r/growth_potion.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/growth-potion.html">Growth\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$100.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/potion-of-greater-strength.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Potion of Greater Strength"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/6/1/61nmylrgpdl._sl1000__1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/potion-of-greater-strength.html">Potion\n' +
    '                                                                                of\n' +
    '                                                                                Greater\n' +
    '                                                                                Strength</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$50.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/shrink-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Shrink Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/e/led_potion.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/shrink-potion.html">Shrink\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$0.01</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/potion-of-luck.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Potion of Luck"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion-of-luck.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/potion-of-luck.html">Potion\n' +
    '                                                                                of\n' +
    '                                                                                Luck</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$77.77</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/potion-113.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Potion 113"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion_n.113.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/potion-113.html">Potion\n' +
    '                                                                                113</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$15.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__item"\n' +
    '                                                 aria-hidden="true"\n' +
    '                                                 aria-live="">\n' +
    '                                                <div style="display: none;">\n' +
    '                                                    <div class="u-text-height-single u-flexbox u-text-height-base u-text-align-start">\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/sleeping-draught.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Sleeping Draught"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/s/l/sleeping-draught-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/sleeping-draught.html">Sleeping\n' +
    '                                                                                Draught</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$24.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/polyjuice-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Polyjuice Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/polyjuice-potion-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/polyjuice-potion.html">Polyjuice\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$35.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/love-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Love Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/o/love-potion-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/love-potion.html">Love\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$6.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/dragon-tonic.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Dragon Tonic"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/d/r/dragon-tonic-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/dragon-tonic.html">Dragon\n' +
    '                                                                                Tonic</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$60.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/aging-potion.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Aging Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/a/g/aging-potion-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/aging-potion.html">Aging\n' +
    '                                                                                Potion</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$25.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                        <article\n' +
    '                                                                class="pw-tile pw--column u-flex">\n' +
    '                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                               href="/potions/unicorn-blood.html">\n' +
    '                                                                <div class="pw-image">\n' +
    '                                                                    <div class="pw-ratio">\n' +
    '                                                                        <div class="pw-ratio__fill"\n' +
    '                                                                             style="padding-bottom: 125%;"></div>\n' +
    '                                                                        <div class="pw-ratio__inner">\n' +
    '                                                                            <span><span><div\n' +
    '                                                                                    type="div"\n' +
    '                                                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                                                    height="auto"\n' +
    '                                                                                    width="100%"\n' +
    '                                                                                    role="presentation"></div></span><img\n' +
    '                                                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                                                    alt="Unicorn Blood Potion"\n' +
    '                                                                                    height="300"\n' +
    '                                                                                    width="240"\n' +
    '                                                                                    draggable="auto"\n' +
    '                                                                                    src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/u/n/unicorn-blood-1.jpg"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </a>\n' +
    '                                                            <div class="pw-tile__details">\n' +
    '                                                                <div class="pw-tile__info">\n' +
    '                                                                    <div class="pw-tile__info-inner">\n' +
    '                                                                        <header class="pw-tile__header">\n' +
    '                                                                            <a class="pw-link pw-tile__primary"\n' +
    '                                                                               href="/potions/unicorn-blood.html">Unicorn\n' +
    '                                                                                Blood</a>\n' +
    '                                                                        </header>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                                <div class="pw-tile__footer">\n' +
    '                                                                    <div class="pw-tile__footer-inner">\n' +
    '                                                                        <div class="pw-tile__quantity"></div>\n' +
    '                                                                        <div class="pw-tile__price">\n' +
    '                                                                            <span itemprop="price"><span>$14.00</span><meta\n' +
    '                                                                                    itemprop="priceCurrency"\n' +
    '                                                                                    content="USD"></span>\n' +
    '                                                                        </div>\n' +
    '                                                                    </div>\n' +
    '                                                                </div>\n' +
    '                                                            </div>\n' +
    '                                                        </article>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                        </div>\n' +
    '                                        <div class="pw-carousel__controls">\n' +
    '                                            <div class="pw-carousel__previous">\n' +
    '                                                <button disabled=""\n' +
    '                                                        class="pw-button"\n' +
    '                                                        data-analytics-name="carousel"\n' +
    '                                                        data-analytics-content="previous"\n' +
    '                                                        type="button">\n' +
    '                                                    <div class="pw-button__inner">\n' +
    '                                                        <svg role="img"\n' +
    '                                                             class="pw-icon"\n' +
    '                                                             title="Show slide 2 of 2"\n' +
    '                                                             aria-labelledby="icon-e1ad2890-2daa-4eb5-98c4-a61c1042725b">\n' +
    '                                                            <title id="icon-e1ad2890-2daa-4eb5-98c4-a61c1042725b">\n' +
    '                                                                Show slide 2 of\n' +
    '                                                                2</title>\n' +
    '                                                            <use role="presentation"\n' +
    '                                                                 xlink:href="#pw-chevron-left"></use>\n' +
    '                                                        </svg>\n' +
    '                                                    </div>\n' +
    '                                                </button>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__pips">\n' +
    '                                                <div class="pw-carousel__pip pw--active">\n' +
    '                                                    <span class="u-visually-hidden">Current slide: 1</span>\n' +
    '                                                </div>\n' +
    '                                                <div class="pw-carousel__pip">\n' +
    '                                                    <span class="u-visually-hidden">Slide 2</span>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                            <div class="pw-carousel__next">\n' +
    '                                                <button class="pw-button"\n' +
    '                                                        data-analytics-name="carousel"\n' +
    '                                                        data-analytics-content="next"\n' +
    '                                                        type="button">\n' +
    '                                                    <div class="pw-button__inner">\n' +
    '                                                        <svg role="img"\n' +
    '                                                             class="pw-icon"\n' +
    '                                                             title="Show slide 2 of 2"\n' +
    '                                                             aria-labelledby="icon-8b28f6cb-4a5e-4aa8-a519-fff39561ffd2">\n' +
    '                                                            <title id="icon-8b28f6cb-4a5e-4aa8-a519-fff39561ffd2">\n' +
    '                                                                Show slide 2 of\n' +
    '                                                                2</title>\n' +
    '                                                            <use role="presentation"\n' +
    '                                                                 xlink:href="#pw-chevron-right"></use>\n' +
    '                                                        </svg>\n' +
    '                                                    </div>\n' +
    '                                                </button>\n' +
    '                                            </div>\n' +
    '                                        </div>\n' +
    '                                    </div>\n' +
    '                                </div>\n' +
    '                            </div>\n' +
    '                        </main>\n' +
    '                        <div id="app-footer" class="u-flex-none">\n' +
    '                            <footer class="t-footer">\n' +
    '                                <div class="t-footer__navigation"></div>\n' +
    '                                <div class="t-footer__extras">\n' +
    '                                    <button class="pw-button t-footer__locale"\n' +
    '                                            type="button">\n' +
    '                                        <div class="pw-button__inner">\n' +
    '                                            <svg role="img"\n' +
    '                                                 class="pw-icon pw--medium u-margin-end-md"\n' +
    '                                                 title="Canada"\n' +
    '                                                 aria-labelledby="icon-dafa11cd-5c31-4cbe-aae9-8ddecc9374ad">\n' +
    '                                                <title id="icon-dafa11cd-5c31-4cbe-aae9-8ddecc9374ad">\n' +
    '                                                    Canada</title>\n' +
    '                                                <use role="presentation"\n' +
    '                                                     xlink:href="#pw-flag-ca"></use>\n' +
    '                                            </svg>\n' +
    '                                            Canada (English)\n' +
    '                                        </div>\n' +
    '                                    </button>\n' +
    '                                </div>\n' +
    '                                <p class="qa-footer__copyright">© 2018 Mobify\n' +
    '                                    Research &amp; Development Inc.</p></footer>\n' +
    '                        </div>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="m-modal-manager">\n' +
    '                <div class="m-modal-manager__open-modals"></div>\n' +
    '                <div class="m-modal-manager__pre-rendered-modals">\n' +
    '                    <div class="pw-sheet__outer-wrapper">\n' +
    '                        <div style="z-index: 1000; position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; pointer-events: none;"></div>\n' +
    '                        <div class="pw-sheet__prerendered-children u-visually-hidden m-navigation"\n' +
    '                             aria-hidden="true">\n' +
    '                            <nav class="pw-nav m-navigation__wrapper">\n' +
    '                                <div class="pw-header-bar"><a\n' +
    '                                        class="pw-link pw-header-bar__title u-flex u-padding-start u-text-align-start u-color-neutral-00"\n' +
    '                                        href="/"><h2\n' +
    '                                        class="u-text-family-header u-text-uppercase">\n' +
    '                                    <span class="u-text-weight-extra-light">Menu</span>\n' +
    '                                </h2></a>\n' +
    '                                    <div class="pw-header-bar__actions">\n' +
    '                                        <button class="pw-button c-icon-label-button"\n' +
    '                                                data-analytics-name="dismiss_modal"\n' +
    '                                                type="button">\n' +
    '                                            <div class="pw-button__inner u-padding-0">\n' +
    '                                                <div>\n' +
    '                                                    <div class="pw-icon-label">\n' +
    '                                                        <div>\n' +
    '                                                            <svg aria-hidden="true"\n' +
    '                                                                 class="pw-icon pw--medium"\n' +
    '                                                                 title=""\n' +
    '                                                                 aria-labelledby="icon-66b74c2b-a8fe-41b5-9a4b-0286eeb291b9">\n' +
    '                                                                <title id="icon-66b74c2b-a8fe-41b5-9a4b-0286eeb291b9"></title>\n' +
    '                                                                <use role="presentation"\n' +
    '                                                                     xlink:href="#pw-close"></use>\n' +
    '                                                            </svg>\n' +
    '                                                            <span class="pw-icon-label__label">close</span>\n' +
    '                                                        </div>\n' +
    '                                                    </div>\n' +
    '                                                </div>\n' +
    '                                            </div>\n' +
    '                                        </button>\n' +
    '                                    </div>\n' +
    '                                </div>\n' +
    '                                <div class="pw-nav-menu">\n' +
    '                                    <div class="pw-nav-slider pw-nav-menu__slider">\n' +
    '                                        <div class="pw-nav-menu__panel">\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/potions.html">\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            Potions\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/books.html">\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            Books\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/ingredients.html">\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            Ingredients\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/supplies.html">\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            Supplies\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/charms.html">\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            Charms\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/new-arrivals.html">\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            New Arrivals\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/starters-kit.html">\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            Starters Kit\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                            <div>\n' +
    '                                                <div class="pw-list-tile pw--is-anchor pw-nav-item u-margin-top-md u-border-top pw--with-icon">\n' +
    '                                                    <a class="pw-link pw-list-tile__primary"\n' +
    '                                                       tabindex="0"\n' +
    '                                                       href="/customer/account/login/">\n' +
    '                                                        <div class="pw-list-tile__action">\n' +
    '                                                            <div class="c-nav-item__icon">\n' +
    '                                                                <svg aria-hidden="true"\n' +
    '                                                                     class="pw-icon c-nav-item__icon-content"\n' +
    '                                                                     title=""\n' +
    '                                                                     aria-labelledby="icon-5f5b5afb-4cc1-4dbf-9843-70975160459c">\n' +
    '                                                                    <title id="icon-5f5b5afb-4cc1-4dbf-9843-70975160459c"></title>\n' +
    '                                                                    <use role="presentation"\n' +
    '                                                                         xlink:href="#pw-user"></use>\n' +
    '                                                                </svg>\n' +
    '                                                            </div>\n' +
    '                                                        </div>\n' +
    '                                                        <div class="pw-list-tile__content">\n' +
    '                                                            Sign In\n' +
    '                                                        </div>\n' +
    '                                                    </a></div>\n' +
    '                                            </div>\n' +
    '                                        </div>\n' +
    '                                    </div>\n' +
    '                                    <div class="pw-nav-menu__non-expanded-items u-visually-hidden"\n' +
    '                                         aria-hidden="true"></div>\n' +
    '                                </div>\n' +
    '                                <div>\n' +
    '                                    <div class="m-navigation__social">\n' +
    '                                        <div class="u-flexbox u-justify-center">\n' +
    '                                            <a href="http://www.facebook.com/#TODO"\n' +
    '                                               class="m-navigation__social-link">\n' +
    '                                                <div class="pw-image">\n' +
    '                                                    <span><span><div type="div"\n' +
    '                                                                     class="pw-skeleton-block pw--image"\n' +
    '                                                                     style="height: 32px; width: 32px;"\n' +
    '                                                                     height="auto"\n' +
    '                                                                     width="100%"\n' +
    '                                                                     role="presentation"></div></span><img\n' +
    '                                                            class="pw-image__tag u-visually-hidden"\n' +
    '                                                            alt="Facebook"\n' +
    '                                                            height="32px"\n' +
    '                                                            width="32px"\n' +
    '                                                            draggable="auto"\n' +
    '                                                            src="/mobify/bundle/1041/static/svg/facebook.svg?20151da8"></span>\n' +
    '                                                </div>\n' +
    '                                            </a><a\n' +
    '                                                href="http://www.twitter.com/#TODO"\n' +
    '                                                class="m-navigation__social-link">\n' +
    '                                            <div class="pw-image"><span><span><div\n' +
    '                                                    type="div"\n' +
    '                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                    style="height: 32px; width: 32px;"\n' +
    '                                                    height="auto" width="100%"\n' +
    '                                                    role="presentation"></div></span><img\n' +
    '                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                    alt="Twitter" height="32px"\n' +
    '                                                    width="32px"\n' +
    '                                                    draggable="auto"\n' +
    '                                                    src="/mobify/bundle/1041/static/svg/twitter.svg?69958ca5"></span>\n' +
    '                                            </div>\n' +
    '                                        </a><a href="http://plus.google.com/#TODO"\n' +
    '                                               class="m-navigation__social-link">\n' +
    '                                            <div class="pw-image"><span><span><div\n' +
    '                                                    type="div"\n' +
    '                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                    style="height: 32px; width: 32px;"\n' +
    '                                                    height="auto" width="100%"\n' +
    '                                                    role="presentation"></div></span><img\n' +
    '                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                    alt="Google+" height="32px"\n' +
    '                                                    width="32px"\n' +
    '                                                    draggable="auto"\n' +
    '                                                    src="/mobify/bundle/1041/static/svg/googleplus.svg?dee09d3d"></span>\n' +
    '                                            </div>\n' +
    '                                        </a><a href="http://www.youtube.com/#TODO"\n' +
    '                                               class="m-navigation__social-link">\n' +
    '                                            <div class="pw-image"><span><span><div\n' +
    '                                                    type="div"\n' +
    '                                                    class="pw-skeleton-block pw--image"\n' +
    '                                                    style="height: 32px; width: 32px;"\n' +
    '                                                    height="auto" width="100%"\n' +
    '                                                    role="presentation"></div></span><img\n' +
    '                                                    class="pw-image__tag u-visually-hidden"\n' +
    '                                                    alt="Youtube" height="32px"\n' +
    '                                                    width="32px"\n' +
    '                                                    draggable="auto"\n' +
    '                                                    src="/mobify/bundle/1041/static/svg/youtube.svg?e60c06d4"></span>\n' +
    '                                            </div>\n' +
    '                                        </a></div>\n' +
    '                                    </div>\n' +
    '                                    <div class="m-navigation__copyright u-padding-md">\n' +
    '                                        <p>© 2017 Mobify Research &amp;\n' +
    '                                            Development Inc. All rights\n' +
    '                                            reserved.</p></div>\n' +
    '                                </div>\n' +
    '                            </nav>\n' +
    '                        </div>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>'

Progressive.initialRenderComplete(
    {
        appState: {
            "addToHomescreen": {"status": "Unsupported"},
            "app": {
                "currentURL": "https://upwa-testing.merlinspotions.com/",
                "selectedCurrency": {
                    "label": "Dollar",
                    "code": "USD",
                    "symbol": "$"
                },
                "isServerSideOrHydrating": false,
                "isServerSide": false,
                "viewportSize": "LARGE",
                "availableCurrencies": [{
                    "label": "Dollar",
                    "symbol": "$",
                    "code": "USD"
                }]
            },
            "categories": {},
            "cart": {},
            "ui": {
                "navigation": {
                    "path": "/", "root": {
                        "children": [{
                            "title": "Potions",
                            "path": "/potions.html",
                            "isCategoryLink": true
                        }, {
                            "title": "Books",
                            "path": "/books.html",
                            "isCategoryLink": true
                        }, {
                            "title": "Ingredients",
                            "path": "/ingredients.html",
                            "isCategoryLink": true
                        }, {
                            "title": "Supplies",
                            "path": "/supplies.html",
                            "isCategoryLink": true
                        }, {
                            "title": "Charms",
                            "path": "/charms.html",
                            "isCategoryLink": true
                        }, {
                            "title": "New Arrivals",
                            "path": "/new-arrivals.html",
                            "isCategoryLink": true
                        }, {
                            "title": "Starters Kit",
                            "path": "/starters-kit.html",
                            "isCategoryLink": true
                        }, {
                            "type": "HiddenAccountItem",
                            "title": "My Account",
                            "options": {
                                "icon": "user",
                                "className": "u-margin-top-md u-border-top"
                            },
                            "path": "/customer/account/"
                        }, {
                            "type": "HiddenAccountItem",
                            "title": "Wishlist",
                            "options": {"icon": "star"},
                            "path": "/wishlist/"
                        }, {
                            "type": "AccountNavItem",
                            "title": "Sign In",
                            "options": {
                                "icon": "user",
                                "className": "u-margin-top-md u-border-top"
                            },
                            "path": "/customer/account/login/"
                        }, {
                            "type": "InstallAppItem",
                            "title": "Install App",
                            "options": {"icon": "download"},
                            "path": "/placeholder/installApp"
                        }], "title": "Root", "path": "/"
                    }
                },
                "accountAddress": {},
                "accountDashboard": {},
                "accountInfo": {},
                "accountOrderList": {},
                "app": {
                    "scrollManager": {"locked": false},
                    "accountURL": "/customer/account/",
                    "orderListURL": "/sales/order/history/",
                    "sprite": "",
                    "isRunningInAstro": false,
                    "accountAddressURL": "/customer/address/",
                    "wishlistURL": "/wishlist/",
                    "signInURL": "/customer/account/login/",
                    "cartURL": "/checkout/cart/",
                    "initialized": true,
                    "accountInfoURL": "/customer/account/edit/",
                    "locale": "en",
                    "checkoutShippingURL": "/checkout/",
                    "hideApp": false
                },
                "cart": {},
                "checkoutConfirmation": {},
                "checkoutPayment": {
                    "isLoading": false,
                    "isFixedPlaceOrderShown": true,
                    "cvvType": "default"
                },
                "checkoutShipping": {},
                "footer": {"signupStatus": "SIGNUP_NOT_ATTEMPTED"},
                "header": {
                    "isCollapsed": false,
                    "searchIsOpen": false,
                    "searchSuggestions": null,
                    "appHistory": ["https://upwa-testing.merlinspotions.com/"]
                },
                "home": {"banners": []},
                "login": {"signinSection": false, "registerSection": false},
                "pageNotFound": {},
                "productDetails": {},
                "productList": {"count": 12},
                "wishlist": {}
            },
            "user": {},
            "modals": {
                "navigation-modal": {"prerender": true},
                "privacy-modal": {"persistent": true}
            },
            "notifications": [],
            "products": {
                "1": {
                    "id": "1",
                    "title": "Eye Of Newt",
                    "price": "12.00",
                    "href": "/potions/eye-of-newt.html",
                    "available": false,
                    "images": [{
                        "alt": "Eye of Newt Potion",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/e/y/eye-of-newt-1.jpg"
                    }]
                },
                "2": {
                    "id": "2",
                    "title": "Unicorn Blood",
                    "price": "14.00",
                    "href": "/potions/unicorn-blood.html",
                    "available": false,
                    "images": [{
                        "alt": "Unicorn Blood Potion",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/u/n/unicorn-blood-1.jpg"
                    }]
                },
                "3": {
                    "id": "3",
                    "title": "Aging Potion",
                    "price": "25.00",
                    "href": "/potions/aging-potion.html",
                    "available": false,
                    "images": [{
                        "alt": "Aging Potion",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/a/g/aging-potion-1.jpg"
                    }]
                },
                "4": {
                    "id": "4",
                    "title": "Dragon Tonic",
                    "price": "60.00",
                    "href": "/potions/dragon-tonic.html",
                    "available": false,
                    "images": [{
                        "alt": "Dragon Tonic",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/d/r/dragon-tonic-1.jpg"
                    }]
                },
                "5": {
                    "id": "5",
                    "title": "Love Potion",
                    "price": "6.00",
                    "href": "/potions/love-potion.html",
                    "available": false,
                    "images": [{
                        "alt": "Love Potion",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/o/love-potion-1.jpg"
                    }]
                },
                "6": {
                    "id": "6",
                    "title": "Polyjuice Potion",
                    "price": "35.00",
                    "href": "/potions/polyjuice-potion.html",
                    "available": false,
                    "images": [{
                        "alt": "Polyjuice Potion",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/polyjuice-potion-1.jpg"
                    }]
                },
                "7": {
                    "id": "7",
                    "title": "Sleeping Draught",
                    "price": "24.00",
                    "href": "/potions/sleeping-draught.html",
                    "available": false,
                    "images": [{
                        "alt": "Sleeping Draught",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/s/l/sleeping-draught-1.jpg"
                    }]
                },
                "40": {
                    "id": "40",
                    "title": "Potion 113",
                    "price": "15.00",
                    "href": "/potions/potion-113.html",
                    "available": false,
                    "images": [{
                        "alt": "Potion 113",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion_n.113.jpg"
                    }]
                },
                "41": {
                    "id": "41",
                    "title": "Potion of Luck",
                    "price": "77.77",
                    "href": "/potions/potion-of-luck.html",
                    "available": false,
                    "images": [{
                        "alt": "Potion of Luck",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion-of-luck.jpg"
                    }]
                },
                "42": {
                    "id": "42",
                    "title": "Shrink Potion",
                    "price": "0.01",
                    "href": "/potions/shrink-potion.html",
                    "available": false,
                    "images": [{
                        "alt": "Shrink Potion",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/e/led_potion.jpg"
                    }]
                },
                "43": {
                    "id": "43",
                    "title": "Potion of Greater Strength",
                    "price": "50.00",
                    "href": "/potions/potion-of-greater-strength.html",
                    "available": false,
                    "images": [{
                        "alt": "Potion of Greater Strength",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/6/1/61nmylrgpdl._sl1000__1.jpg"
                    }]
                },
                "45": {
                    "id": "45",
                    "title": "Growth Potion",
                    "price": "100.00",
                    "href": "/potions/growth-potion.html",
                    "available": false,
                    "images": [{
                        "alt": "Growth Potion",
                        "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/g/r/growth_potion.jpg"
                    }]
                }
            },
            "productSearches": {
                "{\"count\":12,\"filters\":{\"cgid\":\"potions\"},\"start\":0}": {
                    "selectedFilters": [{
                        "query": "cgid=potions",
                        "ruleset": "Category"
                    }],
                    "start": 0,
                    "products": [{
                        "price": "12.00",
                        "available": false,
                        "productId": "1",
                        "href": "/potions/eye-of-newt.html",
                        "thumbnail": {
                            "alt": "Eye Of Newt",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/e/y/eye-of-newt-1.jpg",
                            "title": "Eye Of Newt"
                        },
                        "productName": "Eye Of Newt",
                        "link": "https://www.merlinspotions.com/potions/eye-of-newt.html",
                        "image": {
                            "_type": "image",
                            "alt": "Eye of Newt Potion",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/e/y/eye-of-newt-1.jpg",
                            "title": "Eye of Newt Potion"
                        },
                        "rating": {"count": 5, "total": 5}
                    }, {
                        "price": "100.00",
                        "available": false,
                        "productId": "45",
                        "href": "/potions/growth-potion.html",
                        "thumbnail": {
                            "alt": "Growth Potion",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/g/r/growth_potion.jpg",
                            "title": "Growth Potion"
                        },
                        "productName": "Growth Potion",
                        "link": "https://www.merlinspotions.com/potions/growth-potion.html",
                        "image": {
                            "_type": "image",
                            "alt": "Growth Potion",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/g/r/growth_potion.jpg",
                            "title": "Growth Potion"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "50.00",
                        "available": false,
                        "productId": "43",
                        "href": "/potions/potion-of-greater-strength.html",
                        "thumbnail": {
                            "alt": "Potion of Greater Strength",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/6/1/61nmylrgpdl._sl1000__1.jpg",
                            "title": "Potion of Greater Strength"
                        },
                        "productName": "Potion of Greater Strength",
                        "link": "https://www.merlinspotions.com/potions/potion-of-greater-strength.html",
                        "image": {
                            "_type": "image",
                            "alt": "Potion of Greater Strength",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/6/1/61nmylrgpdl._sl1000__1.jpg",
                            "title": "Potion of Greater Strength"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "0.01",
                        "available": false,
                        "productId": "42",
                        "href": "/potions/shrink-potion.html",
                        "thumbnail": {
                            "alt": "Shrink Potion",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/e/led_potion.jpg",
                            "title": "Shrink Potion"
                        },
                        "productName": "Shrink Potion",
                        "link": "https://www.merlinspotions.com/potions/shrink-potion.html",
                        "image": {
                            "_type": "image",
                            "alt": "Shrink Potion",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/e/led_potion.jpg",
                            "title": "Shrink Potion"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "77.77",
                        "available": false,
                        "productId": "41",
                        "href": "/potions/potion-of-luck.html",
                        "thumbnail": {
                            "alt": "Potion of Luck",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion-of-luck.jpg",
                            "title": "Potion of Luck"
                        },
                        "productName": "Potion of Luck",
                        "link": "https://www.merlinspotions.com/potions/potion-of-luck.html",
                        "image": {
                            "_type": "image",
                            "alt": "Potion of Luck",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion-of-luck.jpg",
                            "title": "Potion of Luck"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "15.00",
                        "available": false,
                        "productId": "40",
                        "href": "/potions/potion-113.html",
                        "thumbnail": {
                            "alt": "Potion 113",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion_n.113.jpg",
                            "title": "Potion 113"
                        },
                        "productName": "Potion 113",
                        "link": "https://www.merlinspotions.com/potions/potion-113.html",
                        "image": {
                            "_type": "image",
                            "alt": "Potion 113",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/potion_n.113.jpg",
                            "title": "Potion 113"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "24.00",
                        "available": false,
                        "productId": "7",
                        "href": "/potions/sleeping-draught.html",
                        "thumbnail": {
                            "alt": "Sleeping Draught",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/s/l/sleeping-draught-1.jpg",
                            "title": "Sleeping Draught"
                        },
                        "productName": "Sleeping Draught",
                        "link": "https://www.merlinspotions.com/potions/sleeping-draught.html",
                        "image": {
                            "_type": "image",
                            "alt": "Sleeping Draught",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/s/l/sleeping-draught-1.jpg",
                            "title": "Sleeping Draught"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "35.00",
                        "available": false,
                        "productId": "6",
                        "href": "/potions/polyjuice-potion.html",
                        "thumbnail": {
                            "alt": "Polyjuice Potion",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/polyjuice-potion-1.jpg",
                            "title": "Polyjuice Potion"
                        },
                        "productName": "Polyjuice Potion",
                        "link": "https://www.merlinspotions.com/potions/polyjuice-potion.html",
                        "image": {
                            "_type": "image",
                            "alt": "Polyjuice Potion",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/p/o/polyjuice-potion-1.jpg",
                            "title": "Polyjuice Potion"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "6.00",
                        "available": false,
                        "productId": "5",
                        "href": "/potions/love-potion.html",
                        "thumbnail": {
                            "alt": "Love Potion",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/o/love-potion-1.jpg",
                            "title": "Love Potion"
                        },
                        "productName": "Love Potion",
                        "link": "https://www.merlinspotions.com/potions/love-potion.html",
                        "image": {
                            "_type": "image",
                            "alt": "Love Potion",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/l/o/love-potion-1.jpg",
                            "title": "Love Potion"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "60.00",
                        "available": false,
                        "productId": "4",
                        "href": "/potions/dragon-tonic.html",
                        "thumbnail": {
                            "alt": "Dragon Tonic",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/d/r/dragon-tonic-1.jpg",
                            "title": "Dragon Tonic"
                        },
                        "productName": "Dragon Tonic",
                        "link": "https://www.merlinspotions.com/potions/dragon-tonic.html",
                        "image": {
                            "_type": "image",
                            "alt": "Dragon Tonic",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/d/r/dragon-tonic-1.jpg",
                            "title": "Dragon Tonic"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "25.00",
                        "available": false,
                        "productId": "3",
                        "href": "/potions/aging-potion.html",
                        "thumbnail": {
                            "alt": "Aging Potion",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/a/g/aging-potion-1.jpg",
                            "title": "Aging Potion"
                        },
                        "productName": "Aging Potion",
                        "link": "https://www.merlinspotions.com/potions/aging-potion.html",
                        "image": {
                            "_type": "image",
                            "alt": "Aging Potion",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/a/g/aging-potion-1.jpg",
                            "title": "Aging Potion"
                        },
                        "rating": {"count": null, "total": 5}
                    }, {
                        "price": "14.00",
                        "available": false,
                        "productId": "2",
                        "href": "/potions/unicorn-blood.html",
                        "thumbnail": {
                            "alt": "Unicorn Blood",
                            "src": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/u/n/unicorn-blood-1.jpg",
                            "title": "Unicorn Blood"
                        },
                        "productName": "Unicorn Blood",
                        "link": "https://www.merlinspotions.com/potions/unicorn-blood.html",
                        "image": {
                            "_type": "image",
                            "alt": "Unicorn Blood Potion",
                            "link": "https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/u/n/unicorn-blood-1.jpg",
                            "title": "Unicorn Blood Potion"
                        },
                        "rating": {"count": null, "total": 5}
                    }],
                    "total": 13,
                    "query": "",
                    "count": 12,
                    "sortingOptions": [{"id": "position"}, {"id": "name"}, {"id": "price"}],
                    "filters": [{
                        "label": "Color",
                        "ruleset": "color",
                        "kinds": [{
                            "label": "Red   ",
                            "count": 2,
                            "searchKey": "8",
                            "query": "8"
                        }, {
                            "label": "Blue   ",
                            "count": 1,
                            "searchKey": "9",
                            "query": "9"
                        }, {
                            "label": "Blue   ",
                            "count": 1,
                            "searchKey": "10",
                            "query": "10"
                        }, {
                            "label": "Green   ",
                            "count": 3,
                            "searchKey": "11",
                            "query": "11"
                        }]
                    }, {
                        "label": "Price",
                        "ruleset": "price",
                        "kinds": [{
                            "label": "$0.00 - $99.99   ",
                            "count": 11,
                            "searchKey": "-100",
                            "query": "-100"
                        }, {
                            "label": "$100.00 and above   ",
                            "count": 2,
                            "searchKey": "100-",
                            "query": "100-"
                        }]
                    }],
                    "selectedSortingOption": "position"
                }
            },
            "checkout": {},
            "offline": {
                "fetchError": null,
                "fetchedPages": [],
                "offlinePageViews": []
            },
            "integrationManager": {"formKey": "FxdjiDX6jt6MKa3q"},
            "form": {},
            "pushMessaging": {
                "pageCount": 1,
                "isSupported": false,
                "systemAskShown": false,
                "visitCountdowns": {},
                "channels": [],
                "status": 0,
                "isReady": false,
                "subscribed": false,
                "locale": "",
                "canSubscribe": false
            }
        }
    }
)
