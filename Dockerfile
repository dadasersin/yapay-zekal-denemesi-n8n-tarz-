FROM n8nio/n8n:latest

USER root

# Debian tabanlı sistemlerde paket yükleme komutu
RUN apt-get update && apt-get install -y git openssh-client && rm -rf /var/lib/apt/lists/*

USER node
