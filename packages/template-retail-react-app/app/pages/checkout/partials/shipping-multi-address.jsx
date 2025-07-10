import React, {useState, useRef, useEffect} from 'react'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {Text, Stack, Button, Container, Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'

const MultiShippingItemAttributes = ({variant, includeQuantity = true}) => {
    // Get display values for attributes
    const variationAttributes = variant?.variationAttributes || [];
    const variationValues = variant?.variationValues || {};
    return (
        <Stack spacing={1.5} flex={1}>
            {variationAttributes && variationAttributes.length > 0 &&
                variationAttributes.map((attr) => {
                    const value = attr.values?.find(v => v.value === variationValues[attr.id]);
                    return (
                        <Text lineHeight={1} color="gray.700" fontSize="sm" key={attr.id}>
                            {attr.name || attr.id}: {value?.name || value?.value || ''}
                        </Text>
                    );
                })}
            {includeQuantity && (
                <Text lineHeight={1} color="gray.700" fontSize="sm">
                    Quantity: {variant.quantity}
                </Text>
            )}
        </Stack>
    );
}

const MultiShipping = ({basket, onSubmit, submitButtonLabel, addNewAddressLabel}) => {
    const {formatMessage} = useIntl()
    if (!basket?.productItems?.length) {
        return <div style={{padding: 32, textAlign: 'center', color: '#888'}}>No items in basket.</div>
    }
    // Fetch product details for all items in the basket
    const productIds = basket.productItems.map((item) => item.productId).join(',');
    const {data: products} = useProducts({parameters: {ids: productIds, allImages: true}}, {enabled: Boolean(productIds)});
    // Map productId to product detail
    const productsMap = products?.data?.reduce((acc, p) => { acc[p.id] = p; return acc; }, {}) || {};
    const {data: customer} = useCurrentCustomer();
    const addresses = customer?.addresses || [];
    // Track selected address per product (by productId + idx)
    const [selectedAddresses, setSelectedAddresses] = useState({});
    // Track open dropdown per product
    const [openDropdown, setOpenDropdown] = useState(null);
    // Close dropdown on outside click
    const dropdownRefs = useRef({});
    useEffect(() => {
        function handleClickOutside(event) {
            if (openDropdown !== null) {
                const ref = dropdownRefs.current[openDropdown];
                if (ref && !ref.contains(event.target)) {
                    setOpenDropdown(null);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);
    // Handler for Add New Address (placeholder)
    const onAddNewAddress = () => {
        // TODO: Implement add new address logic/modal
        alert('Add New Address clicked!');
    };
    return (
        <div style={{padding: '0'}}>
            <style>{`
                @media (max-width: 700px) {
                    .multi-shipping-card {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        height: auto !important;
                    }
                    .multi-shipping-card > div:first-child {
                        height: auto !important;
                    }
                    .multi-shipping-card .multi-shipping-address-col {
                        margin-left: 0 !important;
                        width: 100% !important;
                        min-width: 0 !important;
                        margin-top: 12px !important;
                        max-width: 100% !important;
                        height: auto !important;
                        flex: unset !important;
                    }
                    .multi-shipping-card .multi-shipping-address-col .multi-shipping-price {
                        margin-top: 0 !important;
                        align-self: unset !important;
                        flex: unset !important;
                        width: 100% !important;
                        display: flex !important;
                        justify-content: flex-end !important;
                        text-align: right !important;
                    }
                    .multi-shipping-card .multi-shipping-address-col > div[style*='position:relative'] {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
                .multi-shipping-dropdown-option:hover {
                    background: #f0f4f8 !important;
                }
            `}</style>
            <div style={{border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff', padding: 8}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {basket.productItems.map((item, idx) => {
                        // Merge product details into item
                        const productDetail = productsMap[item.productId] || {};
                        const variant = {...item, ...productDetail};
                        // Use findImageGroupBy to get the image
                        const image = findImageGroupBy(productDetail.imageGroups, {
                            viewType: 'small',
                            selectedVariationAttributes: variant.variationValues
                        })?.images?.[0];
                        const imageUrl = image?.disBaseLink || image?.link || '';
                        const addressKey = item.productId + '-' + idx;
                        const selectedAddressId = selectedAddresses[addressKey] || addresses[0]?.addressId;
                        const selectedAddress = addresses.find(a => a.addressId === selectedAddressId) || addresses[0];
                        return (
                            <div key={addressKey} className="multi-shipping-card" style={{
                                display: 'flex',
                                border: '1px solid #e0e0e0',
                                borderRadius: 6,
                                padding: 16,
                                alignItems: 'flex-start',
                                background: '#fff'
                            }}>
                                {/* Left: Image and info */}
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', minWidth: 0, flex: 1}}>
                                    <img src={imageUrl || 'https://via.placeholder.com/90x120?text=No+Image'} alt={item.productName} style={{width: 90, height: 120, objectFit: 'cover', borderRadius: 4, background: '#f5f5f5'}} />
                                    <ItemVariantProvider variant={variant}>
                                        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, marginLeft: 16}}>
                                            <div style={{fontWeight: 500, fontSize: 16, marginBottom: 4, color: '#111'}}>{item.productName}</div>
                                            <MultiShippingItemAttributes variant={variant} includeQuantity />
                                        </div>
                                    </ItemVariantProvider>
                                </div>
                                {/* Right: Custom Address dropdown and price */}
                                <div className="multi-shipping-address-col" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 320, marginLeft: 32, flex: '0 0 340px', height: '100%'}}>
                                    <div style={{fontWeight: 500, fontSize: 14, marginBottom: 8}}>Delivery Address</div>
                                    {/* Custom Dropdown */}
                                    <div
                                        ref={el => (dropdownRefs.current[addressKey] = el)}
                                        style={{position: 'relative', width: '100%', marginBottom: 24, minWidth: 0}}
                                    >
                                        <div
                                            style={{
                                                border: '1px solid #ccc',
                                                borderRadius: 6,
                                                padding: '4px 12px',
                                                fontSize: 16,
                                                background: '#fafbfc',
                                                cursor: 'pointer',
                                                width: '100%',
                                                maxWidth: '100%',
                                                boxSizing: 'border-box',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                fontWeight: 400,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                            onClick={() => setOpenDropdown(openDropdown === addressKey ? null : addressKey)}
                                        >
                                            <span style={{
                                                display: 'flex',
                                                flex: '1 1 0',
                                                minWidth: 0,
                                                maxWidth: '100%',
                                                width: 0,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                <span style={{fontWeight: 700, whiteSpace: 'nowrap'}}>{selectedAddress?.firstName} {selectedAddress?.lastName}</span>
                                                <span style={{padding: '0 4px'}}>-</span>
                                                <span style={{fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{selectedAddress.address1}, {selectedAddress.city}, {selectedAddress.stateCode} {selectedAddress.postalCode}</span>
                                            </span>
                                            <span style={{marginLeft: 8, fontSize: 18, color: '#888'}}>&#9662;</span>
                                        </div>
                                        {openDropdown === addressKey && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    background: '#fff',
                                                    border: '1px solid #ccc',
                                                    borderRadius: 6,
                                                    zIndex: 10,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                    marginTop: 2,
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    boxSizing: 'border-box',
                                                    overflowX: 'auto'
                                                }}
                                            >
                                                {addresses.map(addr => (
                                                    <div
                                                        key={addr.addressId}
                                                        className="multi-shipping-dropdown-option"
                                                        style={{
                                                            padding: '10px 12px',
                                                            cursor: 'pointer',
                                                            fontSize: 16,
                                                            background: addr.addressId === selectedAddressId ? '#f0f4f8' : '#fff',
                                                            width: '100%',
                                                            maxWidth: '100%',
                                                            boxSizing: 'border-box',
                                                            borderBottom: '1px solid #f0f0f0',
                                                            lineHeight: 1.3
                                                        }}
                                                        onClick={() => {
                                                            setSelectedAddresses(prev => ({...prev, [addressKey]: addr.addressId}));
                                                            setOpenDropdown(null);
                                                        }}
                                                    >
                                                        <div style={{fontWeight: 700, marginBottom: 2}}>{addr.firstName} {addr.lastName}</div>
                                                        <div style={{fontWeight: 400, color: '#444', fontSize: 15}}>
                                                            {addr.address1}, {addr.city}, {addr.stateCode} {addr.postalCode}
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Add New Address option */}
                                                <div
                                                    key="add-new-address"
                                                    style={{
                                                        padding: '4px 12px',
                                                        cursor: 'pointer',
                                                        fontSize: 16,
                                                        color: '#0070d2',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        width: '100%',
                                                        maxWidth: '100%',
                                                        boxSizing: 'border-box',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        borderTop: '1px solid #eee',
                                                        marginTop: 4
                                                    }}
                                                    onClick={() => {
                                                        setOpenDropdown(null);
                                                        onAddNewAddress();
                                                    }}
                                                >
                                                    <span style={{fontWeight: 700, marginRight: 8, fontSize: 18}}>+</span>
                                                    <span>{formatMessage(addNewAddressLabel)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="multi-shipping-price" style={{fontWeight: 600, fontSize: 16, color: '#111', alignSelf: 'flex-end', marginTop: 'auto'}}>
                                        {/* Custom price display: only show total price */}
                                        {typeof variant.priceAfterItemDiscount === 'number' && (
                                            <span>
                                                {new Intl.NumberFormat(undefined, {
                                                    style: 'currency',
                                                    currency: basket?.currency || 'USD',
                                                }).format(variant.priceAfterItemDiscount)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <Box pt={2}>
                <Container variant="form">
                    <Button
                        type="button"
                        width="full"
                        onClick={onSubmit}
                    >
                        {formatMessage(submitButtonLabel)}
                    </Button>
                </Container>
            </Box>
        </div>
    )
}

export default MultiShipping 