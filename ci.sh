#!/bin/sh
while true; do
  git remote update
  UPSTREAM=${1:-'@{u}'}
  LOCAL=$(git rev-parse @)
  REMOTE=$(git rev-parse "$UPSTREAM")
  BASE=$(git merge-base @ "$UPSTREAM")

  if [ $LOCAL = $REMOTE ]; then
    echo "Up-to-date"
  elif [ $LOCAL = $BASE ]; then
    git pull
    docker kill denim
    ./run.sh
  elif [ $REMOTE = $BASE ]; then
    echo "Push required"
  else
    echo "Diverged"
  fi

  sleep 5s
done
