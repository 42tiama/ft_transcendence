#!/bin/bash
set -e

# Start Elasticsearch in the background
/usr/local/bin/docker-entrypoint.sh elasticsearch &

# Wait for Elasticsearch to be available
until curl -s -k -u elastic:"${ELASTIC_PASSWORD}" https://localhost:9200/_cluster/health | grep -q '"status":"green"'; do
	echo "$(date): Waiting for Elasticsearch to be ready..."
  sleep 5
done

echo "$(date): Elasticsearch is ready. Setting passwords..."

# Set kibana_system password via REST API
curl -k -X POST "https://localhost:9200/_security/user/kibana_system/_password" \
  -u elastic:"${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}"

echo "$(date): Passwords set."

# Create a 7 day Index Lifecycle Management policy
echo "$(date): Creating ILM policy..."
curl -k -X PUT "https://localhost:9200/_ilm/policy/delete-after-7-days" \
  -u elastic:"${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "actions": {}
        },
        "delete": {
          "min_age": "7d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'
echo "$(date): ILM policy created."

echo "$(date): Setting index ILM"
curl -k -X PUT "https://localhost:9200/_index_template/daily-logs-template" \
  -u elastic:"${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["transcendence-*"],
    "template": {
      "settings": {
        "index.lifecycle.name": "delete-after-7-days"
      }
    }
  }'
echo "$(date): Index ILM set."

# Bring Elasticsearch process to foreground to keep container alive
wait
