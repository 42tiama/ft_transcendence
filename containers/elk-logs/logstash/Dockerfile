FROM docker.elastic.co/logstash/logstash:9.0.1

USER root

COPY containers/elk-logs/logstash/logstash.conf /usr/share/logstash/pipeline/logstash.conf
COPY certs/logstash /usr/share/logstash/config/certs
COPY certs/ca /usr/share/logstash/config/certs/ca
RUN chmod 644 /usr/share/logstash/config/certs/key.pem
RUN chmod 644 /usr/share/logstash/config/certs/cert.pem
RUN chmod 644 /usr/share/logstash/config/certs/ca/rootCA.pem

USER logstash
