FROM emscripten/emsdk:3.1.69

ENV EMSCRIPTEN /emsdk_portable/sdk

RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y install software-properties-common && \
    add-apt-repository ppa:edd/misc && \
    apt-get update && \
    apt-get -y install ng-cjk automake autoconf wget

ENV BOOST /boost
ENV BOOST_VERSION 1.86
ENV BOOST_UNDERSCORE_VERSION 1_86

# Download and extract Boost
WORKDIR /tmp
RUN wget -c https://boostorg.jfrog.io/artifactory/main/release/${BOOST_VERSION}.0/source/boost_${BOOST_UNDERSCORE_VERSION}_0.tar.bz2 && \
    mkdir ${BOOST} && \
    tar --bzip2 -xf boost_${BOOST_UNDERSCORE_VERSION}_0.tar.bz2 -C ${BOOST} --strip-components=1 && \
    rm -f boost_${BOOST_UNDERSCORE_VERSION}_0.tar.bz2 && \
    rm -rf ${BOOST}/doc

# Build Boost for Emscripten
WORKDIR ${EMSCRIPTEN}
RUN embuilder.py build zlib
ENV NO_BZIP2 1

WORKDIR ${BOOST}
RUN mkdir -p ${BOOST}/lib/emscripten
RUN ./bootstrap.sh && rm -rf stage && \
    emconfigure ./b2 -a -j8 toolset=emscripten link=static threading=single variant=release \
    --with-date_time --with-system --with-filesystem --with-iostreams --with-timer \
    --with-math --with-random --with-thread stage \
    --prefix=${BOOST}/lib/emscripten --build-dir=./build install && rm -rf ./build

# QuantLib
ENV QUANTLIB /quantlib
ENV QUANTLIB_VERSION 1.36

WORKDIR /tmp
RUN wget https://github.com/lballabio/QuantLib/releases/download/v${QUANTLIB_VERSION}/QuantLib-${QUANTLIB_VERSION}.tar.gz -O QuantLib-${QUANTLIB_VERSION}.tar.gz && \
    mkdir ${QUANTLIB} && \
    tar xzf QuantLib-${QUANTLIB_VERSION}.tar.gz -C ${QUANTLIB} --strip-components=1 && \
    rm -f QuantLib-${QUANTLIB_VERSION}.tar.gz

# Build QuantLib with Boost and Emscripten
WORKDIR ${QUANTLIB}
RUN autoreconf --force
RUN emconfigure ./configure --with-boost-include=${BOOST} --with-boost-lib=${BOOST}/lib/emscripten --disable-shared --enable-test-suite=no --disable-dependency-tracking
RUN emmake make -j1 && \
    rm -rf ${QUANTLIB}/Examples && \
    mv ${QUANTLIB}/ql/.libs/libQuantLib.a /tmp && \
    find ${QUANTLIB}/ql -type f  ! \( -name "*.h" -o -name "*.hpp" \) -delete && \
    mv /tmp/libQuantLib.a ${QUANTLIB}/ql/.libs

WORKDIR /src
CMD ["/bin/bash"]