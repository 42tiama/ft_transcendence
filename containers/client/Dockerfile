FROM node:22.14-slim AS deps

COPY /src /src
WORKDIR /src

RUN npm install 

#step2: building
FROM node:22.14-slim AS builder-client
COPY --from=deps /src /src
WORKDIR /src
RUN npm run style --workspace=frontend/client && npm run build --workspace=frontend/client

#step3
FROM node:22.14-slim
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder-client /src/build/ .
COPY --from=deps /src/frontend/client/package.json .
COPY --from=deps /src/node_modules ./node_modules

ENTRYPOINT ["node", "client.js"]

#For debugging purposes
# CMD sleep infinity
