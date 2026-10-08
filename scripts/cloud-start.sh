#!/usr/bin/env bash
set -euo pipefail
cd /workspace/-nachtrag-control
if curl -fsS http://localhost:3000/api/ready >/dev/null 2>&1; then
  echo 'Server and scheduler are already ready.'
  exit 0
fi
if curl -fsS http://localhost:3000/api/health >/dev/null 2>&1; then
  echo 'A server is present but readiness is not confirmed. Inspect its scheduler; do not start a duplicate.' >&2
  exit 1
fi
nohup npm run start:managed > /tmp/nachtrag-control.log 2>&1 < /dev/null &
manager_pid=$!
printf '%s\n' "$manager_pid" > /tmp/nachtrag-control.pid
for attempt in $(seq 1 60); do
  if curl -fsS http://localhost:3000/api/ready >/dev/null 2>&1; then
    echo 'Server, database and independent scheduler are ready.'
    exit 0
  fi
  if ! kill -0 "$manager_pid" 2>/dev/null; then
    echo 'Managed startup exited. Inspect /tmp/nachtrag-control.log without disclosing credentials.' >&2
    exit 1
  fi
  sleep 1
done
echo 'Readiness was not confirmed within 60 seconds. Inspect the managed processes and private log.' >&2
exit 1
