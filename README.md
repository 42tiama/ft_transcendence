
ENV=DEV
ENCRYPTION_SECRET=Asterix@42
ENCRYPTION_SALT=Obelix@42
JWT_SECRET=Ideafix@42
ELASTIC_PASSWORD=secret
KIBANA_PASSWORD=secret
# If developing inside devContainer, uncomment line below before building the devContainer
SINGLE_CONTAINER=true

#Enable Node applications to use mkcert Certificate Authority cert to allow https between services
NODE_EXTRA_CA_CERTS=certs/ca/rootCA.pem

GOOGLE_CLIENT_ID=445999956724-9nbpuf3kfd38j2hrji5sl86aajcrsaou.apps.googleusercontent.com