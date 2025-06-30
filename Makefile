#builda e inicia todos os containers (inclusive o devcontainer)
all: install-mkcert setup
	docker compose up -d

### HTTPS (mTLS) -> Todo mundo usa https para falar com todo mundo, a.k.a. zero trust
# 1.Instala dependencias (mkcert e libnss3-tools) para permitir que navegador do host
#confie nos certificados gerados.
# 2.Gera um Autoridade certificadora local.
# 3.Gera certificados para cada um dos servicos. Servicos acessam isso atraves de
# volumes no docker-compose.yaml
setup:
	mkdir -p certs/client certs/api-gateway certs/game-service certs/auth certs/profile certs/elasticsearch certs/kibana certs/logstash certs/filebeat certs/ca
	CAROOT=$$(./mkcert -CAROOT);\
	if [ ! -f "$$CAROOT/rootCA.pem" ] || [ ! -f "$$CAROOT/rootCA-key.pem" ]; then \
		echo "\033[;32mDid not detect Certificate Authority files. Installing...\033[0m";\
		./mkcert -install; \
	fi; \
	echo "\033[;32mGenerating certificate files and copying CA files...\033[0m";\
	cp "$$(./mkcert -CAROOT)/rootCA.pem" certs/ca/rootCA.pem
	./mkcert -cert-file ./certs/api-gateway/cert.pem -key-file ./certs/api-gateway/key.pem localhost
	./mkcert -cert-file ./certs/game-service/cert.pem -key-file ./certs/game-service/key.pem localhost game-service
	./mkcert -cert-file ./certs/auth/cert.pem -key-file ./certs/auth/key.pem localhost auth
	./mkcert -cert-file ./certs/client/cert.pem -key-file ./certs/client/key.pem localhost
	./mkcert -cert-file ./certs/profile/cert.pem -key-file ./certs/profile/key.pem localhost
	./mkcert -cert-file ./certs/elasticsearch/cert.pem -key-file ./certs/elasticsearch/key.pem localhost elasticsearch
	./mkcert -cert-file ./certs/kibana/cert.pem -key-file ./certs/kibana/key.pem localhost kibana
	./mkcert -cert-file ./certs/logstash/cert.pem -key-file ./certs/logstash/key.pem localhost logstash
	./mkcert -client -cert-file ./certs/filebeat/cert.pem -key-file ./certs/filebeat/key.pem localhost filebeat

install-mkcert:
	if [ ! -f "mkcert" ]; then \
		echo "\033[;32mmkcert not detected... Downloading and installing\033[0m";\
		ARCH=$$(uname -m); \
        OS=$$(uname -s | tr '[:upper:]' '[:lower:]'); \
        case "$$OS" in \
            darwin) \
                case "$$ARCH" in \
                    arm64) URL="https://dl.filippo.io/mkcert/latest?for=darwin/arm64";; \
                    x86_64) URL="https://dl.filippo.io/mkcert/latest?for=darwin/amd64";; \
                esac ;; \
            linux) \
                case "$$ARCH" in \
                    x86_64) URL="https://dl.filippo.io/mkcert/latest?for=linux/amd64";; \
                    aarch64) URL="https://dl.filippo.io/mkcert/latest?for=linux/arm64";; \
                esac ;; \
        esac; \
		curl -JLO "$$URL" &&\
		chmod +x mkcert-v* &&\
		mv mkcert-v* mkcert;\
	fi

#Make certificates only for development build (used inside dev container)
dev-certs: install-mkcert
	bash -c 'mkdir -p src/build/certs/{ca,api-gateway,game-service,auth,client,profile} src/build/data'
	CAROOT=$$(./mkcert -CAROOT);\
		if [ ! -f "$$CAROOT/rootCA.pem" ] || [ ! -f "$$CAROOT/rootCA-key.pem" ]; then \
			echo "\033[;32mDid not detect Certificate Authority files. Installing...\033[0m";\
			./mkcert -install; \
		fi;
	cp "$$(./mkcert -CAROOT)/rootCA.pem" src/build/certs/ca/rootCA.pem
	./mkcert -cert-file src/build/certs/api-gateway/cert.pem -key-file src/build/certs/api-gateway/key.pem localhost
	./mkcert -cert-file src/build/certs/auth/cert.pem -key-file src/build/certs/auth/key.pem localhost auth
	./mkcert -cert-file src/build/certs/client/cert.pem -key-file src/build/certs/client/key.pem localhost
	./mkcert -cert-file src/build/certs/game-service/cert.pem -key-file src/build/certs/game-service/key.pem localhost game-service
	./mkcert -cert-file src/build/certs/profile/cert.pem -key-file src/build/certs/profile/key.pem localhost profile


clean:
	docker compose down --volumes --remove-orphans

fclean: clean
	rm -rf certs
	rm mkcert
	docker system prune --all --volumes --force

re: fclean
	make all

rebuild-client:
	docker compose up --detach --build client

rebuild-apigateway:
	docker compose up --detach --build api-gateway

rebuild-game:
	docker compose up --detach --build game-service

rebuild-auth:
	docker compose up --detach --build auth

rebuild-profile:
	docker compose up --detach --build profile

#clean entire build folder
bclean:
	rm -rf src/build/*

.PHONY: clean
