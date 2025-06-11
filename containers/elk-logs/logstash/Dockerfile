FROM docker.elastic.co/logstash/logstash:9.0.1

USER root

COPY logstash.yml /usr/share/logstash/config/logstash.yml
COPY ./logstash.conf /usr/share/logstash/pipeline/logstash.conf