docker run --rm --name=denim --network=public -v `pwd`:/app -d node:12 bash -c "cd /app && yarn install && (yarn web & (ENABLE_SYNC=1 yarn server))" && docker logs -f denim
