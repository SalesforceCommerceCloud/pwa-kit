#!/usr/bin/env bash

# Update package list
apt-get -qq update

# Install python deps & python
apt-get -y -qq install build-essential python-dev
apt-get -y -qq install python2.7

# Install unzip
apt-get -y -qq install unzip

# Install AWS CLI
curl --silent "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip -qq awscli-bundle.zip
./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

