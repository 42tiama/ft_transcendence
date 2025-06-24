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
	mkdir -p certs/client certs/api-gateway certs/auth certs/elasticsearch certs/kibana certs/logstash certs/filebeat certs/ca
	./mkcert -install ||\
	cp "$$(./mkcert -CAROOT)/rootCA.pem" certs/ca/rootCA.pem && \
	./mkcert -cert-file ./certs/api-gateway/cert.pem -key-file ./certs/api-gateway/key.pem localhost && \
	./mkcert -cert-file ./certs/auth/cert.pem -key-file ./certs/auth/key.pem localhost auth && \
	./mkcert -cert-file ./certs/client/cert.pem -key-file ./certs/client/key.pem localhost && \
	./mkcert -cert-file ./certs/elasticsearch/cert.pem -key-file ./certs/elasticsearch/key.pem localhost elasticsearch && \
	./mkcert -cert-file ./certs/kibana/cert.pem -key-file ./certs/kibana/key.pem localhost kibana && \
	./mkcert -cert-file ./certs/logstash/cert.pem -key-file ./certs/logstash/key.pem localhost logstash && \
	./mkcert -client -cert-file ./certs/filebeat/cert.pem -key-file ./certs/filebeat/key.pem localhost filebeat

install-mkcert:
	if [ ! -f "mkcert" ]; then \
		curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64" &&\
		chmod +x mkcert-v*-linux-amd64 &&\
		mv mkcert-v*-linux-amd64 mkcert;\
	fi

#Make certificates only for development build (used inside dev container)
dev-certs: install-mkcert
	bash -c 'mkdir -p src/build/certs/{api-gateway,auth,client} src/build/data'
	./mkcert -install ||\
	./mkcert -cert-file src/build/certs/api-gateway/cert.pem -key-file src/build/certs/api-gateway/key.pem localhost &&\
	./mkcert -cert-file src/build/certs/auth/cert.pem -key-file src/build/certs/auth/key.pem localhost auth &&\
	./mkcert -cert-file src/build/certs/client/cert.pem -key-file src/build/certs/client/key.pem localhost 


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
