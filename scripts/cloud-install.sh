#!/usr/bin/env bash
set -euo pipefail
cd /workspace/-nachtrag-control
export npm_config_cache=/workspace/.npm-cache
export npm_config_devdir=/workspace/.node-gyp
npm ci
npm run setup
npm run seed
npm run build
