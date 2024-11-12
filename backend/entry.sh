#!/bin/sh
npm start & prometheus --config.file=/etc/prometheus/prometheus.yml --web.listen-address=:9090 --storage.tsdb.path=/prometheus-data --storage.tsdb.retention.time=30d