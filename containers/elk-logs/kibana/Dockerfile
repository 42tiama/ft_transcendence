FROM docker.elastic.co/kibana/kibana:9.0.1

USER root

COPY kibana.yml /usr/share/kibana/config/kibana.yml
COPY dashboard.ndjson /usr/share/kibana/dashboard.ndjson
COPY start.sh /usr/share/bin/start.sh
RUN chmod +x /usr/share/bin/start.sh

USER kibana

CMD ["/usr/share/bin/start.sh"]