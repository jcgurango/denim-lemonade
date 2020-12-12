docker run --rm --name=denim --network=public -v `pwd`:/app -it node:12 bash -c "cd /app && yarn install && (yarn web & yarn server)"
