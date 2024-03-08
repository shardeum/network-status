const prometheus = require('prom-client');
const https = require('https');
const express = require('express');

const axios = require('axios').create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

interface Endpoint {
    url: string;
    name: string;
    help: string;
    body?: {
        jsonrpc: string;
        method: string;
        params: any[];
        id: number;
    };
}

interface Group {
    group: string;
    servers: Endpoint[];
}

interface Endpoints {
    urls: (Group | Endpoint)[];
}

class Health {
    static instance: any;
    endpoints: any;
    urlGauge: any;

    constructor() {
        if (Health.instance) {
            return Health.instance;
        }
        prometheus.collectDefaultMetrics({ register: new prometheus.Registry(), timeout: 5000 });
        this.endpoints = require('../../resources/endpoints.json');
        this.urlGauge = new prometheus.Gauge({
            name: 'Shardeum',
            help: 'Shardeum Uptime Monitor',
            labelNames: ['name', 'url', 'help']
        })
    }

    check() {
        setInterval(() => {
            this.endpoints.urls.forEach((url: Group | Endpoint) => {
                if ('servers' in url) {
                    url.servers.forEach((node: Endpoint) => {
                        this.checkUrl(node);
                    });
                } else {
                    this.checkUrl(url);
                }
            });
        }, 10000)
    }

    checkUrl(url: Group | Endpoint) {
        if ('body' in url && url.body) {
            axios.post(url.url, url.body)
                .then((response: any) => {
                    this.urlGauge.labels(url.name, url.url, url.help).set(1);
                })
                .catch((error: any) => {
                    this.urlGauge.labels(url.name, url.url, url.help).set(0);
                });
        } else {
            if ('url' in url) {
                axios.get(url.url)
                    .then((response: any) => {
                        this.urlGauge.labels(url.name, url.url, url.help).set(1);
                    })
                    .catch((error: any) => {
                        this.urlGauge.labels(url.name, url.url, url.help).set(0)
                    })
            }
        }
    }

}

module.exports = new Health();