#!/bin/bash

if [[ ! -d build/frontend ]]; then
    mkdir -p build/frontend
fi

echo "Building frontend..."

tsc client/main.ts --outFile build/frontend/main.js
cp client/index.html build/frontend/index.html

exit 0