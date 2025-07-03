#!/bin/bash

# Simple build script without QuantLib dependency

echo "Building simple WebAssembly module..."

# Create build directory if it doesn't exist
mkdir -p build

# Compile the WebAssembly module
emcc src/simple_test.cpp \
    -o build/quantlib_simple.js \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createQuantLibModule" \
    -s EXPORT_ES6=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT='web,node' \
    -lembind \
    -O3 \
    -std=c++17

echo "Build complete! Output files:"
echo "  - build/quantlib_simple.js"
echo "  - build/quantlib_simple.wasm"