FROM docker.elastic.co/kibana/kibana:9.0.1

USER root

COPY containers/elk-logs/kibana/kibana.yml /usr/share/kibana/config/kibana.yml
COPY containers/elk-logs/kibana/dashboard.ndjson /usr/share/kibana/dashboard.ndjson
COPY containers/elk-logs/kibana/start.sh /usr/share/bin/start.sh

COPY certs/kibana /usr/share/kibana/config/certs
COPY certs/ca /usr/share/kibana/config/certs/ca
RUN chmod 644 /usr/share/kibana/config/certs/key.pem
RUN chmod 644 /usr/share/kibana/config/certs/cert.pem
RUN chmod 644 /usr/share/kibana/config/certs/ca/rootCA.pem

RUN chmod +x /usr/share/bin/start.sh

USER kibana

CMD ["/usr/share/bin/start.sh"]
