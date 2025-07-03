#!/bin/bash

# Build script for QuantLib WebAssembly module

# Check if emcc is available
if ! command -v emcc &> /dev/null; then
    echo "Emscripten not found. Please install Emscripten SDK first."
    echo "Visit: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

echo "Building QuantLib WebAssembly module..."

# Create build directory if it doesn't exist
mkdir -p build

# Compile the WebAssembly module
emcc src/quantlib_simple.cpp \
    -o build/quantlib.js \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createQuantLibModule" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s ENVIRONMENT='web,node' \
    -lembind \
    -O3 \
    -std=c++17 \
    -I/usr/include/ql \
    -lQuantLib \
    || {
        echo "Build failed. Make sure QuantLib is installed."
        echo "On Ubuntu/Debian: sudo apt-get install libquantlib0-dev"
        echo "On macOS: brew install quantlib"
        exit 1
    }

echo "Build complete! Output files:"
echo "  - build/quantlib.js"
echo "  - build/quantlib.wasm"