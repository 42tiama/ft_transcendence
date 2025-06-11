FROM docker.elastic.co/elasticsearch/elasticsearch:9.0.1

USER root

RUN mkdir -p /config
COPY ./instances.yml /config/instances.yml

COPY ./certs_setup.sh /usr/share/elasticsearch/certs_setup.sh
RUN chmod +x /usr/share/elasticsearch/certs_setup.sh

CMD ["/usr/share/elasticsearch/certs_setup.sh"]