#builda e inicia todos os containers (inclusive o devcontainer)
all:
	docker compose up -d

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

rebuild-cert:
	docker compose up --detach --build certificate-authority

#clean entire build folder
bclean:
	rm -rf src/build/*

.PHONY: clean
