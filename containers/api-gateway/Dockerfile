#Step 1: build
FROM node:22.14 AS builder

COPY /src /src
WORKDIR /src

RUN npm install --workspace=backend/api-gateway && npm run build --workspace=backend/api-gateway

FROM node:22.14
WORKDIR /build
COPY --from=builder /src/build/backend/api-gateway.js .
COPY --from=builder /src/backend/api-gateway/package.json .
COPY --from=builder /src/node_modules ./node_modules

ENTRYPOINT ["node", "api-gateway.js"]
# CMD sleep infinity
