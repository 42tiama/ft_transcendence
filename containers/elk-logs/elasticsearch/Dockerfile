FROM docker.elastic.co/elasticsearch/elasticsearch:9.0.1

USER root

COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

COPY setup.sh /usr/share/elasticsearch/setup.sh
RUN chmod +x /usr/share/elasticsearch/setup.sh

USER elasticsearch

ENTRYPOINT ["/usr/share/elasticsearch/setup.sh"]