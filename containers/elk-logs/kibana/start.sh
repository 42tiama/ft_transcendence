#!/bin/bash

# Start Kibana in background
/usr/share/kibana/bin/kibana &

# Wait until Kibana is up
until curl -s --cacert /usr/share/kibana/config/certs/ca/rootCA.pem \
  -u elastic:$ELASTIC_PASSWORD https://localhost:5601/api/status | grep -q '"level":"available"'; do
  echo "Waiting for Kibana..."
  sleep 5
done

# Import the dashboards
curl -u elastic:$ELASTIC_PASSWORD \
  -X POST --cacert /usr/share/kibana/config/certs/ca/rootCA.pem "https://localhost:5601/api/saved_objects/_import?overwrite=true" \
  -H "kbn-xsrf: true" \
  --form file=@/usr/share/kibana/dashboard.ndjson

wait
