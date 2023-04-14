#!/bin/bash
#
# Copyright (c) 2022, Salesforce, Inc.
# All rights reserved.
# SPDX-License-Identifier: BSD-3-Clause
# For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
#

#
# Author: Josh Begleiter
# Date: 2020-05-04
# Description: Look in GUS for packages with 3PP

if [ $# -lt 2 ]; then
echo "Expected package name and GUS username (including @gus.com)"
echo "$0 package-name 'foo@gus.com'"
exit 1
fi

if [ ! $(which sfdx 2> /dev/null) ]; then
echo "Please install sfdx ( https://developer.salesforce.com/tools/sfdxcli ) before continuing"
exit 2
fi

# Log in once (first)
#sfdx force:auth:web:login -r https://gus.my.salesforce.com

SEARCH_PACKAGE_NAME="$1"
GUS_USERNAME="$2"

sfdx data:query -q "SELECT Id, Name, Version__c, Perforce_Path__c, Approval_Status__c FROM ADM_Third_Party_Software__c WHERE Name LIKE '%${SEARCH_PACKAGE_NAME}%'" -u $GUS_USERNAME -r csv