/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const mockAddresses = [
    {
        description: '123 Main Street, New York, NY 10001, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ1234567890',
        reference: 'ref_1234567890',
        structured_formatting: {
            main_text: '123 Main Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'New York, NY 10001, USA'
        },
        terms: [
            {offset: 0, value: '123 Main Street'},
            {offset: 17, value: 'New York'},
            {offset: 27, value: 'NY'},
            {offset: 30, value: '10001'},
            {offset: 37, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '456 Oak Avenue, Los Angeles, CA 90210, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ4567890123',
        reference: 'ref_4567890123',
        structured_formatting: {
            main_text: '456 Oak Avenue',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Los Angeles, CA 90210, USA'
        },
        terms: [
            {offset: 0, value: '456 Oak Avenue'},
            {offset: 16, value: 'Los Angeles'},
            {offset: 29, value: 'CA'},
            {offset: 32, value: '90210'},
            {offset: 39, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '789 Pine Road, Chicago, IL 60601, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ7890123456',
        reference: 'ref_7890123456',
        structured_formatting: {
            main_text: '789 Pine Road',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Chicago, IL 60601, USA'
        },
        terms: [
            {offset: 0, value: '789 Pine Road'},
            {offset: 14, value: 'Chicago'},
            {offset: 22, value: 'IL'},
            {offset: 25, value: '60601'},
            {offset: 31, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '321 Elm Street, Miami, FL 33101, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ3210987654',
        reference: 'ref_3210987654',
        structured_formatting: {
            main_text: '321 Elm Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Miami, FL 33101, USA'
        },
        terms: [
            {offset: 0, value: '321 Elm Street'},
            {offset: 15, value: 'Miami'},
            {offset: 21, value: 'FL'},
            {offset: 24, value: '33101'},
            {offset: 30, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '654 Cedar Lane, Seattle, WA 98101, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ6543210987',
        reference: 'ref_6543210987',
        structured_formatting: {
            main_text: '654 Cedar Lane',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Seattle, WA 98101, USA'
        },
        terms: [
            {offset: 0, value: '654 Cedar Lane'},
            {offset: 15, value: 'Seattle'},
            {offset: 23, value: 'WA'},
            {offset: 26, value: '98101'},
            {offset: 32, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '987 Maple Drive, Austin, TX 78701, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ9876543210',
        reference: 'ref_9876543210',
        structured_formatting: {
            main_text: '987 Maple Drive',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Austin, TX 78701, USA'
        },
        terms: [
            {offset: 0, value: '987 Maple Drive'},
            {offset: 15, value: 'Austin'},
            {offset: 22, value: 'TX'},
            {offset: 25, value: '78701'},
            {offset: 31, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '147 Broadway, New York, NY 10038, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ1472583690',
        reference: 'ref_1472583690',
        structured_formatting: {
            main_text: '147 Broadway',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'New York, NY 10038, USA'
        },
        terms: [
            {offset: 0, value: '147 Broadway'},
            {offset: 13, value: 'New York'},
            {offset: 23, value: 'NY'},
            {offset: 26, value: '10038'},
            {offset: 33, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '258 Market Street, San Francisco, CA 94102, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ2583691470',
        reference: 'ref_2583691470',
        structured_formatting: {
            main_text: '258 Market Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'San Francisco, CA 94102, USA'
        },
        terms: [
            {offset: 0, value: '258 Market Street'},
            {offset: 18, value: 'San Francisco'},
            {offset: 33, value: 'CA'},
            {offset: 36, value: '94102'},
            {offset: 42, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '369 State Street, Boston, MA 02101, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ3691472580',
        reference: 'ref_3691472580',
        structured_formatting: {
            main_text: '369 State Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Boston, MA 02101, USA'
        },
        terms: [
            {offset: 0, value: '369 State Street'},
            {offset: 16, value: 'Boston'},
            {offset: 23, value: 'MA'},
            {offset: 26, value: '02101'},
            {offset: 32, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '159 Washington Avenue, Philadelphia, PA 19101, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ1592583691',
        reference: 'ref_1592583691',
        structured_formatting: {
            main_text: '159 Washington Avenue',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Philadelphia, PA 19101, USA'
        },
        terms: [
            {offset: 0, value: '159 Washington Avenue'},
            {offset: 22, value: 'Philadelphia'},
            {offset: 35, value: 'PA'},
            {offset: 38, value: '19101'},
            {offset: 44, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '42 Wallaby Way, Sydney, NSW 2000, Australia',
        matched_substrings: [{length: 2, offset: 0}],
        place_id: 'ChIJ42wallabyway',
        reference: 'ref_42wallabyway',
        structured_formatting: {
            main_text: '42 Wallaby Way',
            main_text_matched_substrings: [{length: 2, offset: 0}],
            secondary_text: 'Sydney, NSW 2000, Australia'
        },
        terms: [
            {offset: 0, value: '42 Wallaby Way'},
            {offset: 15, value: 'Sydney'},
            {offset: 22, value: 'NSW'},
            {offset: 26, value: '2000'},
            {offset: 31, value: 'Australia'}
        ],
        types: ['street_address']
    },
    {
        description: '221B Baker Street, London, UK NW1 6XE',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ221bbakerstreet',
        reference: 'ref_221bbakerstreet',
        structured_formatting: {
            main_text: '221B Baker Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'London, UK NW1 6XE'
        },
        terms: [
            {offset: 0, value: '221B Baker Street'},
            {offset: 18, value: 'London'},
            {offset: 25, value: 'UK'},
            {offset: 28, value: 'NW1 6XE'}
        ],
        types: ['street_address']
    },
    {
        description: '1600 Pennsylvania Avenue NW, Washington, DC 20500, USA',
        matched_substrings: [{length: 4, offset: 0}],
        place_id: 'ChIJ1600pennsylvania',
        reference: 'ref_1600pennsylvania',
        structured_formatting: {
            main_text: '1600 Pennsylvania Avenue NW',
            main_text_matched_substrings: [{length: 4, offset: 0}],
            secondary_text: 'Washington, DC 20500, USA'
        },
        terms: [
            {offset: 0, value: '1600 Pennsylvania Avenue NW'},
            {offset: 28, value: 'Washington'},
            {offset: 39, value: 'DC'},
            {offset: 42, value: '20500'},
            {offset: 48, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '1 Infinite Loop, Cupertino, CA 95014, USA',
        matched_substrings: [{length: 1, offset: 0}],
        place_id: 'ChIJ1infiniteloop',
        reference: 'ref_1infiniteloop',
        structured_formatting: {
            main_text: '1 Infinite Loop',
            main_text_matched_substrings: [{length: 1, offset: 0}],
            secondary_text: 'Cupertino, CA 95014, USA'
        },
        terms: [
            {offset: 0, value: '1 Infinite Loop'},
            {offset: 16, value: 'Cupertino'},
            {offset: 26, value: 'CA'},
            {offset: 29, value: '95014'},
            {offset: 35, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '350 Fifth Avenue, New York, NY 10118, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ350fifthavenue',
        reference: 'ref_350fifthavenue',
        structured_formatting: {
            main_text: '350 Fifth Avenue',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'New York, NY 10118, USA'
        },
        terms: [
            {offset: 0, value: '350 Fifth Avenue'},
            {offset: 17, value: 'New York'},
            {offset: 27, value: 'NY'},
            {offset: 30, value: '10118'},
            {offset: 36, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '1234 Tech Boulevard, San Jose, CA 95113, USA',
        matched_substrings: [{length: 4, offset: 0}],
        place_id: 'ChIJ1234techblvd',
        reference: 'ref_1234techblvd',
        structured_formatting: {
            main_text: '1234 Tech Boulevard',
            main_text_matched_substrings: [{length: 4, offset: 0}],
            secondary_text: 'San Jose, CA 95113, USA'
        },
        terms: [
            {offset: 0, value: '1234 Tech Boulevard'},
            {offset: 19, value: 'San Jose'},
            {offset: 28, value: 'CA'},
            {offset: 31, value: '95113'},
            {offset: 37, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '567 Innovation Drive, Mountain View, CA 94043, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ567innovation',
        reference: 'ref_567innovation',
        structured_formatting: {
            main_text: '567 Innovation Drive',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Mountain View, CA 94043, USA'
        },
        terms: [
            {offset: 0, value: '567 Innovation Drive'},
            {offset: 20, value: 'Mountain View'},
            {offset: 33, value: 'CA'},
            {offset: 36, value: '94043'},
            {offset: 42, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '890 Startup Circle, Palo Alto, CA 94301, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ890startup',
        reference: 'ref_890startup',
        structured_formatting: {
            main_text: '890 Startup Circle',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Palo Alto, CA 94301, USA'
        },
        terms: [
            {offset: 0, value: '890 Startup Circle'},
            {offset: 18, value: 'Palo Alto'},
            {offset: 28, value: 'CA'},
            {offset: 31, value: '94301'},
            {offset: 37, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '234 Venture Way, Menlo Park, CA 94025, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ234venture',
        reference: 'ref_234venture',
        structured_formatting: {
            main_text: '234 Venture Way',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Menlo Park, CA 94025, USA'
        },
        terms: [
            {offset: 0, value: '234 Venture Way'},
            {offset: 16, value: 'Menlo Park'},
            {offset: 27, value: 'CA'},
            {offset: 30, value: '94025'},
            {offset: 36, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '789 Silicon Valley Road, Santa Clara, CA 95054, USA',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ789silicon',
        reference: 'ref_789silicon',
        structured_formatting: {
            main_text: '789 Silicon Valley Road',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Santa Clara, CA 95054, USA'
        },
        terms: [
            {offset: 0, value: '789 Silicon Valley Road'},
            {offset: 24, value: 'Santa Clara'},
            {offset: 35, value: 'CA'},
            {offset: 38, value: '95054'},
            {offset: 44, value: 'USA'}
        ],
        types: ['street_address']
    },
    {
        description: '123 Yonge Street, Toronto, ON M5C 1W4, Canada',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ123yonge',
        reference: 'ref_123yonge',
        structured_formatting: {
            main_text: '123 Yonge Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Toronto, ON M5C 1W4, Canada'
        },
        terms: [
            {offset: 0, value: '123 Yonge Street'},
            {offset: 16, value: 'Toronto'},
            {offset: 24, value: 'ON'},
            {offset: 27, value: 'M5C 1W4'},
            {offset: 35, value: 'Canada'}
        ],
        types: ['street_address']
    },
    {
        description: '456 Robson Street, Vancouver, BC V6B 2A3, Canada',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ456robson',
        reference: 'ref_456robson',
        structured_formatting: {
            main_text: '456 Robson Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Vancouver, BC V6B 2A3, Canada'
        },
        terms: [
            {offset: 0, value: '456 Robson Street'},
            {offset: 17, value: 'Vancouver'},
            {offset: 26, value: 'BC'},
            {offset: 29, value: 'V6B 2A3'},
            {offset: 37, value: 'Canada'}
        ],
        types: ['street_address']
    },
    {
        description: '789 Sainte-Catherine Street, Montreal, QC H3B 1B1, Canada',
        matched_substrings: [{length: 3, offset: 0}],
        place_id: 'ChIJ789sainte',
        reference: 'ref_789sainte',
        structured_formatting: {
            main_text: '789 Sainte-Catherine Street',
            main_text_matched_substrings: [{length: 3, offset: 0}],
            secondary_text: 'Montreal, QC H3B 1B1, Canada'
        },
        terms: [
            {offset: 0, value: '789 Sainte-Catherine Street'},
            {offset: 28, value: 'Montreal'},
            {offset: 36, value: 'QC'},
            {offset: 39, value: 'H3B 1B1'},
            {offset: 47, value: 'Canada'}
        ],
        types: ['street_address']
    }
]
