#Step 1: build
FROM node:22.14 AS builder

COPY /src /src
WORKDIR /src

RUN npm install --workspace=backend/auth && npm run build --workspace=backend/auth

FROM node:22.14
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder /src/build/auth.js .
COPY --from=builder /src/backend/auth/package.json .
COPY --from=builder /src/node_modules ./node_modules

ENTRYPOINT ["node", "auth.js"]
# CMD sleep infinity
