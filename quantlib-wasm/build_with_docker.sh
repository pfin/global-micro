#!/bin/bash

echo "Building QuantLib WebAssembly module using pre-built Docker image..."

# Use the pre-built CaptorAB image which has QuantLib and Boost already compiled
docker pull captorab/emscripten-quantlib:1.36.1

# Run the build command inside the container
docker run --platform linux/amd64 \
    --mount type=bind,source="${PWD}",target=/src \
    -it captorab/emscripten-quantlib:1.36.1 \
    make build_bindings

echo "Build complete! Check the build/ directory for output files."