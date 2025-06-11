#builda e inicia todos os containers (inclusive o devcontainer)
all: setup
	docker compose up -d

setup:
# 	@echo "We'll need your sudo password to install two packages: mkcert and libnss3-tools..."Add commentMore actions
# 	if [ "$$(uname)" = "Darwin" ]; then \
# 	brew list mkcert >/dev/null 2>&1 || brew install mkcert; \
# 	brew list nss >/dev/null 2>&1 || brew install nss; \
# 	else \
# 	sudo apt update && sudo apt install -y mkcert libnss3-tools; \
# 	fi
# 	mkdir -p certs/client certs/api-gateway certs/auth
	mkdir -p certs/elk
# 	mkcert --install
# 	mkcert -cert-file ./certs/api-gateway/cert.pem -key-file ./certs/api-gateway/key.pem localhost
# 	mkcert -cert-file ./certs/auth/cert.pem -key-file ./certs/auth/key.pem localhost
# 	mkcert -cert-file ./certs/client/cert.pem -key-file ./certs/client/key.pem localhost
# 	mkcert -cert-file ./certs/elasticsearch/cert.pem -key-file ./certs/elasticsearch/key.pem localhost
# 	cp "$(mkcert -CAROOT)/rootCA.pem" ./certs/elasticsearch/ca.pem

clean:
	docker compose down --volumes --remove-orphans

fclean: clean
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
