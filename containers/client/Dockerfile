#Step 1: build
FROM node:22.14 AS builder

COPY /src /src
WORKDIR /src

RUN npm install --workspace=frontend/client && npm run style --workspace=frontend/client && npm run build --workspace=frontend/client

FROM node:22.14
WORKDIR /build
COPY --from=builder /src/build/ .
COPY --from=builder /src/frontend/client/package.json .
COPY --from=builder /src/node_modules ./node_modules

ENTRYPOINT ["node", "client.js"]

#For debugging purposes
# CMD sleep infinity
