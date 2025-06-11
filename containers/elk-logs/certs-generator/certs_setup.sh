#!/bin/bash

if [ ! -f /certs/ca/ca.crt ]; then
    echo "Creating Certificate Authority";
    elasticsearch-certutil ca --silent --pem --out /certs/ca.zip &&
    unzip /certs/ca.zip -d /certs/ca &&
    rm -f /certs/ca.zip
fi

if [ ! -f /config/instances.yml ]; then
    echo "❌ instances.yml not found!"
    exit 1
else
    echo "Creating certs";
    elasticsearch-certutil cert --silent --pem -out /certs/certs.zip --in /config/instances.yml \
        --ca-cert /certs/ca/ca.crt --ca-key /certs/ca/ca.key;
    unzip /certs/certs.zip -d /certs
    rm -f /certs/certs.zip
fi;