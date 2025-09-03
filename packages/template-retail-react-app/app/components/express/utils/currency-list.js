/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const CurrencyList = [
    {
        Code: 'AED',
        Currency: 'UAE Dirham',
        Decimals: '2'
    },
    {
        Code: 'ALL',
        Currency: 'Albanian Lek',
        Decimals: '2'
    },
    {
        Code: 'AMD',
        Currency: 'Armenian Dram',
        Decimals: '2'
    },
    {
        Code: 'ANG',
        Currency: 'Antillian Guilder',
        Decimals: '2'
    },
    {
        Code: 'AOA',
        Currency: 'Angolan Kwanza',
        Decimals: '2'
    },
    {
        Code: 'ARS',
        Currency: 'Nuevo Argentine Peso',
        Decimals: '2'
    },
    {
        Code: 'AUD',
        Currency: 'Australian Dollar',
        Decimals: '2'
    },
    {
        Code: 'AWG',
        Currency: 'Aruban Guilder',
        Decimals: '2'
    },
    {
        Code: 'AZN',
        Currency: 'Azerbaijani manat',
        Decimals: '2'
    },
    {
        Code: 'BAM',
        Currency: 'Bosnia and Herzegovina Convertible Marks',
        Decimals: '2'
    },
    {
        Code: 'BBD',
        Currency: 'Barbados Dollar',
        Decimals: '2'
    },
    {
        Code: 'BDT',
        Currency: 'Bangladesh Taka',
        Decimals: '2'
    },
    {
        Code: 'BGN',
        Currency: 'New Bulgarian Lev',
        Decimals: '2'
    },
    {
        Code: 'BHD',
        Currency: 'Bahraini Dinar',
        Decimals: '3'
    },
    {
        Code: 'BMD',
        Currency: 'Bermudian Dollar',
        Decimals: '2'
    },
    {
        Code: 'BND',
        Currency: 'Brunei Dollar',
        Decimals: '2'
    },
    {
        Code: 'BOB',
        Currency: 'Bolivia Boliviano',
        Decimals: '2'
    },
    {
        Code: 'BRL',
        Currency: 'Brazilian Real',
        Decimals: '2'
    },
    {
        Code: 'BSD',
        Currency: 'Bahamian Dollar',
        Decimals: '2'
    },
    {
        Code: 'BWP',
        Currency: 'Botswana Pula',
        Decimals: '2'
    },
    {
        Code: 'BYN',
        Currency: 'New Belarusian Ruble',
        Decimals: '2'
    },
    {
        Code: 'BZD',
        Currency: 'Belize Dollar',
        Decimals: '2'
    },
    {
        Code: 'CAD',
        Currency: 'Canadian Dollar',
        Decimals: '2'
    },
    {
        Code: 'CHF',
        Currency: 'Swiss Franc',
        Decimals: '2'
    },
    {
        Code: 'CLP',
        Currency: 'Chilean Peso',
        Decimals: '2'
    },
    {
        Code: 'CNY',
        Currency: 'Yuan Renminbi',
        Decimals: '2'
    },
    {
        Code: 'COP',
        Currency: 'Colombian Peso',
        Decimals: '2'
    },
    {
        Code: 'CRC',
        Currency: 'Costa Rican Colon',
        Decimals: '2'
    },
    {
        Code: 'CUP',
        Currency: 'Cuban Peso',
        Decimals: '2'
    },
    {
        Code: 'CVE',
        Currency: 'Cape Verdi Escudo',
        Decimals: '0'
    },
    {
        Code: 'CZK',
        Currency: 'Czech Koruna',
        Decimals: '2'
    },
    {
        Code: 'DJF',
        Currency: 'Djibouti Franc',
        Decimals: '0'
    },
    {
        Code: 'DKK',
        Currency: 'Danish Krone',
        Decimals: '2'
    },
    {
        Code: 'DOP',
        Currency: 'Dominican Republic Peso',
        Decimals: '2'
    },
    {
        Code: 'DZD',
        Currency: 'Algerian Dinar',
        Decimals: '2'
    },
    {
        Code: 'EGP',
        Currency: 'Egyptian Pound',
        Decimals: '2'
    },
    {
        Code: 'ETB',
        Currency: 'Ethiopian Birr',
        Decimals: '2'
    },
    {
        Code: 'EUR',
        Currency: 'Euro',
        Decimals: '2'
    },
    {
        Code: 'FJD',
        Currency: 'Fiji Dollar',
        Decimals: '2'
    },
    {
        Code: 'FKP',
        Currency: 'Falkland Islands Pound',
        Decimals: '2'
    },
    {
        Code: 'GBP',
        Currency: 'Pound Sterling',
        Decimals: '2'
    },
    {
        Code: 'GEL',
        Currency: 'Georgian Lari',
        Decimals: '2'
    },
    {
        Code: 'GHS',
        Currency: 'Ghanaian Cedi (3rd)',
        Decimals: '2'
    },
    {
        Code: 'GIP',
        Currency: 'Gibraltar Pound',
        Decimals: '2'
    },
    {
        Code: 'GMD',
        Currency: 'Gambia Delasi',
        Decimals: '2'
    },
    {
        Code: 'GNF',
        Currency: 'Guinea Franc',
        Decimals: '0'
    },
    {
        Code: 'GTQ',
        Currency: 'Guatemala Quetzal',
        Decimals: '2'
    },
    {
        Code: 'GYD',
        Currency: 'Guyanese Dollar',
        Decimals: '2'
    },
    {
        Code: 'HKD',
        Currency: 'Hong Kong Dollar',
        Decimals: '2'
    },
    {
        Code: 'HNL',
        Currency: 'Honduras Lempira',
        Decimals: '2'
    },
    {
        Code: 'HTG',
        Currency: 'Haitian Gourde',
        Decimals: '2'
    },
    {
        Code: 'HUF',
        Currency: 'Hungarian Forint',
        Decimals: '2'
    },
    {
        Code: 'IDR',
        Currency: 'Indonesian Rupiah',
        Decimals: '0'
    },
    {
        Code: 'ILS',
        Currency: 'New Israeli Scheqel',
        Decimals: '2'
    },
    {
        Code: 'INR',
        Currency: 'Indian Rupee',
        Decimals: '2'
    },
    {
        Code: 'IQD',
        Currency: 'Iraqi Dinar',
        Decimals: '3'
    },
    {
        Code: 'ISK',
        Currency: 'Iceland Krona',
        Decimals: '2'
    },
    {
        Code: 'JMD',
        Currency: 'Jamaican Dollar',
        Decimals: '2'
    },
    {
        Code: 'JOD',
        Currency: 'Jordanian Dinar',
        Decimals: '3'
    },
    {
        Code: 'JPY',
        Currency: 'Japanese Yen',
        Decimals: '0'
    },
    {
        Code: 'KES',
        Currency: 'Kenyan Shilling',
        Decimals: '2'
    },
    {
        Code: 'KGS',
        Currency: 'Kyrgyzstan Som',
        Decimals: '2'
    },
    {
        Code: 'KHR',
        Currency: 'Cambodia Riel',
        Decimals: '2'
    },
    {
        Code: 'KMF',
        Currency: 'Comoro Franc',
        Decimals: '0'
    },
    {
        Code: 'KRW',
        Currency: 'South-Korean Won',
        Decimals: '0'
    },
    {
        Code: 'KWD',
        Currency: 'Kuwaiti Dinar',
        Decimals: '3'
    },
    {
        Code: 'KYD',
        Currency: 'Cayman Islands Dollar',
        Decimals: '2'
    },
    {
        Code: 'KZT',
        Currency: 'Kazakhstani Tenge',
        Decimals: '2'
    },
    {
        Code: 'LAK',
        Currency: 'Laos Kip',
        Decimals: '2'
    },
    {
        Code: 'LBP',
        Currency: 'Lebanese Pound',
        Decimals: '2'
    },
    {
        Code: 'LKR',
        Currency: 'Sri Lanka Rupee',
        Decimals: '2'
    },
    {
        Code: 'LYD',
        Currency: 'Libyan Dinar',
        Decimals: '3'
    },
    {
        Code: 'MAD',
        Currency: 'Moroccan Dirham',
        Decimals: '2'
    },
    {
        Code: 'MDL',
        Currency: 'Moldovia Leu',
        Decimals: '2'
    },
    {
        Code: 'MKD',
        Currency: 'Macedonian Denar',
        Decimals: '2'
    },
    {
        Code: 'MMK',
        Currency: 'Myanmar Kyat',
        Decimals: '2'
    },
    {
        Code: 'MNT',
        Currency: 'Mongolia Tugrik',
        Decimals: '2'
    },
    {
        Code: 'MOP',
        Currency: 'Macau Pataca',
        Decimals: '2'
    },
    {
        Code: 'MRU',
        Currency: 'Mauritania Ouguiya',
        Decimals: '2'
    },
    {
        Code: 'MUR',
        Currency: 'Mauritius Rupee',
        Decimals: '2'
    },
    {
        Code: 'MVR',
        Currency: 'Maldives Rufiyaa',
        Decimals: '2'
    },
    {
        Code: 'MWK',
        Currency: 'Malawi Kwacha',
        Decimals: '2'
    },
    {
        Code: 'MXN',
        Currency: 'Mexican Peso',
        Decimals: '2'
    },
    {
        Code: 'MYR',
        Currency: 'Malaysian Ringgit',
        Decimals: '2'
    },
    {
        Code: 'MZN',
        Currency: 'Mozambican Metical',
        Decimals: '2'
    },
    {
        Code: 'NAD',
        Currency: 'Namibian Dollar',
        Decimals: '2'
    },
    {
        Code: 'NGN',
        Currency: 'Nigerian Naira',
        Decimals: '2'
    },
    {
        Code: 'NIO',
        Currency: 'Nicaragua Cordoba Oro',
        Decimals: '2'
    },
    {
        Code: 'NOK',
        Currency: 'Norwegian Krone',
        Decimals: '2'
    },
    {
        Code: 'NPR',
        Currency: 'Nepalese Rupee',
        Decimals: '2'
    },
    {
        Code: 'NZD',
        Currency: 'New Zealand Dollar',
        Decimals: '2'
    },
    {
        Code: 'OMR',
        Currency: 'Rial Omani',
        Decimals: '3'
    },
    {
        Code: 'PAB',
        Currency: 'Panamanian Balboa',
        Decimals: '2'
    },
    {
        Code: 'PEN',
        Currency: 'Peruvian Nuevo Sol',
        Decimals: '2'
    },
    {
        Code: 'PGK',
        Currency: 'New Guinea Kina',
        Decimals: '2'
    },
    {
        Code: 'PHP',
        Currency: 'Philippine Peso',
        Decimals: '2'
    },
    {
        Code: 'PKR',
        Currency: 'Pakistan Rupee',
        Decimals: '2'
    },
    {
        Code: 'PLN',
        Currency: 'New Polish Zloty',
        Decimals: '2'
    },
    {
        Code: 'PYG',
        Currency: 'Paraguay Guarani',
        Decimals: '0'
    },
    {
        Code: 'QAR',
        Currency: 'Qatari Rial',
        Decimals: '2'
    },
    {
        Code: 'RON',
        Currency: 'New Romanian Lei',
        Decimals: '2'
    },
    {
        Code: 'RSD',
        Currency: 'Serbian Dinar',
        Decimals: '2'
    },
    {
        Code: 'RUB',
        Currency: 'Russian Ruble',
        Decimals: '2'
    },
    {
        Code: 'RWF',
        Currency: 'Rwanda Franc',
        Decimals: '0'
    },
    {
        Code: 'SAR',
        Currency: 'Saudi Riyal',
        Decimals: '2'
    },
    {
        Code: 'SBD',
        Currency: 'Solomon Island Dollar',
        Decimals: '2'
    },
    {
        Code: 'SCR',
        Currency: 'Seychelles Rupee',
        Decimals: '2'
    },
    {
        Code: 'SEK',
        Currency: 'Swedish Krone',
        Decimals: '2'
    },
    {
        Code: 'SGD',
        Currency: 'Singapore Dollar',
        Decimals: '2'
    },
    {
        Code: 'SHP',
        Currency: 'St. Helena Pound',
        Decimals: '2'
    },
    {
        Code: 'SLE',
        Currency: 'Sierra Leone Leone',
        Decimals: '2'
    },
    {
        Code: 'SOS',
        Currency: 'Somalia Shilling',
        Decimals: '2'
    },
    {
        Code: 'SRD',
        Currency: 'Surinamese dollar',
        Decimals: '2'
    },
    {
        Code: 'STN',
        Currency: 'Sao Tome & Principe Dobra',
        Decimals: '2'
    },
    {
        Code: 'SVC',
        Currency: 'El Salvador Colón',
        Decimals: '2'
    },
    {
        Code: 'SZL',
        Currency: 'Swaziland Lilangeni',
        Decimals: '2'
    },
    {
        Code: 'THB',
        Currency: 'Thai Baht',
        Decimals: '2'
    },
    {
        Code: 'TND',
        Currency: 'Tunisian Dinar',
        Decimals: '3'
    },
    {
        Code: 'TOP',
        Currency: "Tonga Pa'anga",
        Decimals: '2'
    },
    {
        Code: 'TRY',
        Currency: 'New Turkish Lira',
        Decimals: '2'
    },
    {
        Code: 'TTD',
        Currency: 'Trinidad & Tobago Dollar',
        Decimals: '2'
    },
    {
        Code: 'TWD',
        Currency: 'New Taiwan Dollar',
        Decimals: '2'
    },
    {
        Code: 'TZS',
        Currency: 'Tanzanian Shilling',
        Decimals: '2'
    },
    {
        Code: 'UAH',
        Currency: 'Ukraine Hryvnia',
        Decimals: '2'
    },
    {
        Code: 'UGX',
        Currency: 'Uganda Shilling',
        Decimals: '0'
    },
    {
        Code: 'USD',
        Currency: 'US Dollars',
        Decimals: '2'
    },
    {
        Code: 'UYU',
        Currency: 'Peso Uruguayo',
        Decimals: '2'
    },
    {
        Code: 'UZS',
        Currency: 'Uzbekistani Som',
        Decimals: '2'
    },
    {
        Code: 'VEF',
        Currency: 'Venezuelan Bolívar',
        Decimals: '2'
    },
    {
        Code: 'VND',
        Currency: 'Vietnamese New Dong',
        Decimals: '0'
    },
    {
        Code: 'VUV',
        Currency: 'Vanuatu Vatu',
        Decimals: '0'
    },
    {
        Code: 'WST',
        Currency: 'Samoan Tala',
        Decimals: '2'
    },
    {
        Code: 'XAF',
        Currency: 'CFA Franc BEAC',
        Decimals: '0'
    },
    {
        Code: 'XCD',
        Currency: 'East Caribbean Dollar',
        Decimals: '2'
    },
    {
        Code: 'XOF',
        Currency: 'CFA Franc BCEAO',
        Decimals: '0'
    },
    {
        Code: 'XPF',
        Currency: 'CFP Franc',
        Decimals: '0'
    },
    {
        Code: 'YER',
        Currency: 'Yemeni Rial',
        Decimals: '2'
    },
    {
        Code: 'ZAR',
        Currency: 'South African Rand',
        Decimals: '2'
    },
    {
        Code: 'ZMW',
        Currency: 'Zambian Kwacha',
        Decimals: '2'
    }
]

export default CurrencyList
