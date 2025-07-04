FROM docker.elastic.co/beats/filebeat:9.0.1

USER root

COPY containers/elk-logs/filebeat/filebeat.yml /usr/share/filebeat/filebeat.yml
COPY certs/filebeat /usr/share/filebeat/config/certs
COPY certs/ca /usr/share/filebeat/config/certs/ca
RUN chmod 644 /usr/share/filebeat/config/certs/key.pem
RUN chmod 644 /usr/share/filebeat/config/certs/cert.pem
RUN chmod 644 /usr/share/filebeat/config/certs/ca/rootCA.pem


RUN chown root:root /usr/share/filebeat/filebeat.yml && \
    chmod 644 /usr/share/filebeat/filebeat.yml
