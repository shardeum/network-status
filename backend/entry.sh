#!/bin/sh
npm start & prometheus --config.file=/etc/prometheus/prometheus.yml --web.listen-address=:9090