#!/bin/bash

pushd "$(dirname "$0")"

docker-compose up -d

echo "Delete .DS_Store & .idea to prevent possible errors on mac"
find .. -name '.DS_Store'  -delete -print -exec rm -f {} +
find .. -name '.idea'  -type d -delete -print -exec rm -rf {} +
find .. -name '.idea'  -delete -print -exec rm -f {} +

echo -e "\n⏳️ Waiting to let the cluster start up"
sleep 10;  #so the broker doesn't start spamming warnings immediately
until [ "`docker inspect -f {{.State.Running}} zookeeper`" == "true" ]; do
    sleep 1;
done;
until [ "`docker inspect -f {{.State.Running}} broker`" == "true" ]; do
    sleep 1;
done;
until [ "`docker inspect -f {{.State.Running}} schema-registry`" == "true" ]; do
    sleep 1;
done;
until [ "`docker inspect -f {{.State.Running}} control-center`" == "true" ]; do
    sleep 1;
done;
echo -e "✅️ Cluster is ready\n"

# create each topic
### topics we consume
docker exec broker kafka-topics --create --topic lane.match.route.v1 --bootstrap-server localhost:9092

### topics we publish (internal topics are also consumed)
docker exec broker kafka-topics --create --topic routingguide.matched.lane.v1 --bootstrap-server localhost:9092
docker exec broker kafka-topics --create --topic routingguide.open.route.v1 --bootstrap-server localhost:9092
docker exec broker kafka-topics --create --topic routingguide.match.lane.v1 --bootstrap-server localhost:9092

# register the schemas

pushd "../topic-registry-publish-job"
yarn
yarn start:local
popd

echo -e "\n==========Schemas=========="
echo -e "Publishing non routing guide schemas..."

echo -e "\n⏳️ Schema registration for lane.match.route.v1"
echo -e "Key Details:"
curl -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data "@../schemas/non-routing-guide/lane.match.route.key.v1.json" \
  http://localhost:8081/subjects/lane.match.route.v1-key/versions
echo -e "\nValue Details:"
curl -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data "@../schemas/non-routing-guide/lane.match.route.value.v1.json" \
  http://localhost:8081/subjects/lane.match.route.v1-value/versions

echo -e "\n==========Schemas=========="
echo -e "✨  Done Publishing non routing guide schemas"

echo -e "\nYour local Kafka instance is ready to roll...."
echo "Be sure all your settings are set to the following: \"BrokerUri\": \"localhost:9092\",\"SchemaRegistryUri\": \"localhost:8081\""
echo "To see your local cluster go to the confluent control center @ http://localhost:9021"

popd
