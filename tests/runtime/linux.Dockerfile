FROM debian:bookworm-slim@sha256:abd67ffcfa541b485a3dff59865ab629aa048a6c613e639d36e7456b0b229241

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      bash \
      busybox \
      ca-certificates \
      gawk \
      gcc \
      libc6-dev \
      ncat \
      netcat-openbsd \
      nodejs \
      perl \
      php-cli \
      python-is-python3 \
      python3 \
      ruby \
      socat \
    && rm -rf /var/lib/apt/lists/*

COPY udp_controller.py /opt/web-revshell-runtime/udp_controller.py

USER 65534:65534
WORKDIR /tmp

CMD ["sleep", "infinity"]
