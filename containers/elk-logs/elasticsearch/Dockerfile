FROM docker.elastic.co/elasticsearch/elasticsearch:9.0.1

USER root

COPY containers/elk-logs/elasticsearch/elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml
COPY certs/elasticsearch /usr/share/elasticsearch/config/certs/
COPY certs/ca /usr/share/elasticsearch/config/certs/ca
RUN chmod 644 /usr/share/elasticsearch/config/certs/key.pem
RUN chmod 644 /usr/share/elasticsearch/config/certs/cert.pem
RUN chmod 644 /usr/share/elasticsearch/config/certs/ca/rootCA.pem

COPY containers/elk-logs/elasticsearch/setup.sh /usr/share/elasticsearch/setup.sh
RUN chmod +x /usr/share/elasticsearch/setup.sh

USER elasticsearch

ENTRYPOINT ["/usr/share/elasticsearch/setup.sh"]
