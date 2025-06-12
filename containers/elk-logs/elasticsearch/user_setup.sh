#!/bin/bash
set -e

# Start Elasticsearch in the background
/usr/local/bin/docker-entrypoint.sh elasticsearch &

# Wait for Elasticsearch to be available
until curl -s -k -u elastic:"${ELASTIC_PASSWORD}" https://localhost:9200/_cluster/health | grep -q '"status":"green"'; do
  echo "Waiting for Elasticsearch to be ready..."
  sleep 5
done

echo "Elasticsearch is ready. Setting passwords..."

# Set kibana_system password via REST API (replace with your password)
curl -k -X POST "https://localhost:9200/_security/user/kibana_system/_password" \
  -u elastic:"${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}"

echo "Passwords set."

# Bring Elasticsearch process to foreground to keep container alive
wait
