#Step 1: build
FROM node:22.14 as builder

COPY /src /src
WORKDIR /src

RUN npm install --workspace=backend/server && npm run build --workspace=backend/server

FROM node:22.14
WORKDIR /build
COPY --from=builder /src/build/backend/server.js .
COPY --from=builder /src/backend/server/package.json .
COPY --from=builder /src/node_modules ./node_modules

ENTRYPOINT ["node", "server.js"]
