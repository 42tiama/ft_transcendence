FROM docker.elastic.co/elasticsearch/elasticsearch:9.0.1

USER root

COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

COPY user_setup.sh /usr/share/elasticsearch/user_setup.sh
RUN chmod +x /usr/share/elasticsearch/user_setup.sh

USER elasticsearch

ENTRYPOINT ["/usr/share/elasticsearch/user_setup.sh"]