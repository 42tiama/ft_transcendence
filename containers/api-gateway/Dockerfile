#Step 1: dependencies
FROM node:22.14 AS deps

COPY /src /src
WORKDIR /src

RUN npm install 

#step2: building
FROM node:22.14 AS builder-api
COPY --from=deps /src /src
WORKDIR /src
RUN npm run build --workspace=backend/api-gateway

FROM node:22.14
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder-api /src/build/api-gateway.js .
COPY --from=deps /src/backend/api-gateway/package.json .
COPY --from=deps /src/node_modules ./node_modules

ENTRYPOINT ["node", "api-gateway.js"]
# CMD sleep infinity
