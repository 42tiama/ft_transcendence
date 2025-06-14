#builda e inicia todos os containers (inclusive o devcontainer)
all: setup
	docker compose up -d

### HTTPS (mTLS) -> Todo mundo usa https para falar com todo mundo, a.k.a. zero trust
# 1.Instala dependencias (mkcert e libnss3-tools) para permitir que navegador do host
#confie nos certificados gerados.
# 2.Gera um Autoridade certificadora local.
# 3.Gera certificados para cada um dos servicos. Servicos acessam isso atraves de
# volumes no docker-compose.yaml
setup:
	mkdir -p certs/client certs/api-gateway certs/auth certs/elasticsearch certs/kibana certs/logstash certs/filebeat certs/ca
	mkcert --install
	cp "$$(mkcert -CAROOT)/rootCA.pem" certs/ca/rootCA.pem
	mkcert -cert-file ./certs/api-gateway/cert.pem -key-file ./certs/api-gateway/key.pem localhost
	mkcert -cert-file ./certs/auth/cert.pem -key-file ./certs/auth/key.pem localhost auth
	mkcert -cert-file ./certs/client/cert.pem -key-file ./certs/client/key.pem localhost
	mkcert -cert-file ./certs/elasticsearch/cert.pem -key-file ./certs/elasticsearch/key.pem localhost elasticsearch
	mkcert -cert-file ./certs/kibana/cert.pem -key-file ./certs/kibana/key.pem localhost kibana
	mkcert -cert-file ./certs/logstash/cert.pem -key-file ./certs/logstash/key.pem localhost logstash
	mkcert -cert-file ./certs/filebeat/cert.pem -key-file ./certs/filebeat/key.pem localhost filebeat
	if [ "$$(whoami)" = "cadete" ]; then \
	  PROFILE=$$(find ~/snap/firefox/common/.mozilla/firefox -maxdepth 1 -type d -name "*.default*" | head -n 1) && \
	  certutil -A -n "mkcert development CA" -t "CT,C,C" -i  ~/.local/share/mkcert/rootCA.pem -d sql:"$$PROFILE" ; \
	fi

prepare:
	@echo "We'll need your sudo password to install two packages: mkcert and libnss3-tools..."
	if [ "$$(uname)" = "Darwin" ]; then \
	brew list mkcert >/dev/null 2>&1 || brew install mkcert; \
	brew list nss >/dev/null 2>&1 || brew install nss; \
	else \
	sudo apt update && sudo apt install -y mkcert libnss3-tools; \
	fi
	if [ "$$(whoami)" = "cadete" ]; then \
	  sudo apt-get install -y ca-certificates curl && \
	  sudo install -m 0755 -d /etc/apt/keyrings && \
	  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && \
	  sudo chmod a+r /etc/apt/keyrings/docker.asc && \
	  echo "deb [arch=$$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
	  $$(. /etc/os-release && echo "$${UBUNTU_CODENAME:-$$VERSION_CODENAME}") stable" | \
	  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null && \
	  sudo apt-get update && \
	  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin; \
	  sudo usermod -aG docker cadete; \
	  sudo pkill -KILL -u cadete; \
	fi

clean:
	docker compose down --volumes --remove-orphans

fclean: clean
	rm -rf certs
	docker system prune --all --volumes --force

re: fclean
	make all

rebuild-client:
	docker compose up --detach --build client

rebuild-apigateway:
	docker compose up --detach --build api-gateway

rebuild-auth:
	docker compose up --detach --build auth

#clean entire build folder
bclean:
	rm -rf src/build/*

.PHONY: clean
