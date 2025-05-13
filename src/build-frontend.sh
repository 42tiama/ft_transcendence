#!/bin/bash

if [[ ! -d build/frontend ]]; then
    mkdir -p build/frontend
fi

echo "Building frontend..."

# tsc frontend/main.ts --outFile build/frontend/main.js
cp frontend/index.html build/frontend/index.html

exit 0