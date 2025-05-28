FROM alpine:latest

RUN apk update && apk add --no-cache openssl bash

WORKDIR /root

COPY create-certs.sh .
RUN chmod +x create-certs.sh

ENTRYPOINT ["./create-certs.sh"]
