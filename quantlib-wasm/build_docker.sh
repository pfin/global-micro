#!/bin/bash

echo "Building QuantLib WebAssembly module using Docker..."

# Build the Docker image
docker build -t quantlib-wasm-builder .

# Run the container and copy the built files
docker run --rm -v "$(pwd)/build:/src/build" quantlib-wasm-builder

echo "Build complete! Check the build/ directory for output files."