#!/bin/bash

set -e

OUT_DIR="/out"
SERVICES=("api-gateway" "auth" "client")

###Generate self signed root Certificate
mkdir -p $OUT_DIR/ca

#generate private key to sign certificate
openssl genrsa -out $OUT_DIR/ca/rootCA.key 2048 

#generate certificate signed with previously generated privatekey
openssl req -x509 -new -nodes -key $OUT_DIR/ca/rootCA.key -sha256 -days 365 \
	-subj "/CN=TranscendenceRootCA" \
	-out $OUT_DIR/ca/rootCA.pem


#generate private keys and certificates for each service
for SERVICE in "${SERVICES[@]}"; do
	mkdir -p $OUT_DIR/$SERVICE

	#privatekey
	openssl genrsa -out $OUT_DIR/$SERVICE/key.pem 2048

	#Certificate Signing Request
	openssl req -new -key $OUT_DIR/$SERVICE/key.pem \
		-subj "/CN=$SERVICE.local" \
		-out $OUT_DIR/$SERVICE/csr.pem

	#Certificate
	openssl x509 -req -in $OUT_DIR/$SERVICE/csr.pem \
		-CA $OUT_DIR/ca/rootCA.pem \
		-CAkey $OUT_DIR/ca/rootCA.key \
		-CAcreateserial \
		-out $OUT_DIR/$SERVICE/cert.pem \
		-days 365 \
		-sha256

	#Explain
	cp $OUT_DIR/ca/rootCA.pem $OUT_DIR/$SERVICE/ca.pem

	#Explain
	rm $OUT_DIR/$SERVICE/csr.pem
done
