# Build WebAssembly bindings for QuantLib
build_bindings:
	mkdir -p build
	emcc --bind -I${EMSCRIPTEN}/system/include -I${QUANTLIB} -I${BOOST} -O3 \
		-s MODULARIZE=1 -s "EXTRA_EXPORTED_RUNTIME_METHODS=['addOnPostRun']" \
		-s EXPORT_NAME=createQuantLibModule -s EXPORT_ES6=1 \
		-s TOTAL_MEMORY=64MB -o build/quantlib.js src/quantlib_bindings.cpp ${QUANTLIB}/ql/.libs/libQuantLib.a

# Build using Docker
build_docker:
	docker build -t quantlib-wasm-builder .
	docker run --mount type=bind,source="${PWD}",target=/src -it quantlib-wasm-builder make build_bindings

# Run interactive shell in Docker
shell:
	docker run --mount type=bind,source="${PWD}",target=/src -it --rm quantlib-wasm-builder /bin/bash

# Clean build files
clean:
	rm -rf build/

.PHONY: build_bindings build_docker shell clean