const prometheus = require('prom-client');
const axios = require('axios');
interface Group {
    group: string;
    servers: Endpoint[];
}
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
    expectedResponse: any;
}

class HealthChecker {
    static instance: HealthChecker;
    endpoints: (Group | Endpoint)[] = [];
    serverHealth: any;
    serviceHealthGauge: any;
    checkingStatus = new Map();
    constructor() {
        if (HealthChecker.instance) {
            return HealthChecker.instance;
        }
        const loadedEndpoints = require('../../endpoints.json');
        this.endpoints = this.flattenEndpoints(loadedEndpoints.urls);
        this.serviceHealthGauge = new prometheus.Gauge({
            name: 'Shardeum',
            help: 'Current health status of services (1 = online, 0 = offline)',
            labelNames: ['name', 'duration', 'timestamp'],
        });
        HealthChecker.instance = this;
        this.startPeriodicChecks();
    }
    flattenEndpoints(urls: any[]) {
        // If an endpoint is part of a group, it is flattened so that each service can be checked individually
        return urls.flatMap(endpoint => 'servers' in endpoint ? endpoint.servers : [endpoint]);
    }
    async checkService(service: Endpoint) {
        this.checkingStatus.set(service.name, true)
        const startTime = Date.now();
        try {
            const response = service.body ? await axios.post(service.url, service.body) : await axios.get(service.url);
            const statusOk = response.status >= 200 && response.status < 300;
            let isExpectedResponseIncluded = false;
            if (typeof service.expectedResponse === 'string') {
                let body = response.data;
                const responseString = body.toString().toLowerCase().trim();
                const expectedResponseString = service.expectedResponse.toString().toLowerCase().trim();
                isExpectedResponseIncluded = responseString.includes(expectedResponseString);
            } else {
                const body = response.data;
                isExpectedResponseIncluded = this.checkJsonResponse(body, service.expectedResponse);
            }
            if (statusOk && isExpectedResponseIncluded) {
                const duration = (Date.now() - startTime) / 1000;
                this.serviceHealthGauge.set({
                    name: service.name,
                    duration,
                    timestamp: Date.now()
                }, 1)
                this.checkingStatus.set(service.name, false)
                console.log(`Service ${service.name} is healthy`);
            } else {
                const duration = (Date.now() - startTime) / 1000;
                this.serviceHealthGauge.set({
                    name: service.name,
                    duration,
                    timestamp: Date.now()
                }, 0)
                this.checkingStatus.set(service.name, false)
                console.log(`Service ${service.name} is unhealthy`);
            }
        }
        catch (error: any) {
            const duration = (Date.now() - startTime) / 1000;
            this.serviceHealthGauge.set({
                name: service.name,
                duration,
                timestamp: Date.now()
            }, 0)
            this.checkingStatus.set(service.name, false)
            console.log(`Service ${service.name} is unhealthy`);
        }
    }
    checkJsonResponse(response: any, expectedResponse: any) {
        for (const key of Object.keys(expectedResponse)) {
            if (!response.hasOwnProperty(key)) {
                return false; // key not found
            }
            if (typeof expectedResponse[key] === 'object' && !Array.isArray(expectedResponse[key])) {
                if (!this.checkJsonResponse(response[key], expectedResponse[key])) {
                    return false;
                }
            } else if (Array.isArray(expectedResponse[key])) {
                if (!Array.isArray(response[key]) || response.length === 0) {
                    return false;
                }
            } else {
                if (response[key] !== expectedResponse[key]) {
                    return false;
                }
            }
        }
        return true;
    }

    async checkServiceWithTimeout(service: Endpoint, timeout = 120000) {
        // Any ongoing service check should not take longer than 2 minutes
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Service check timed out')), timeout)
        );
        try {
            await Promise.race([this.checkService(service), timeoutPromise]);
        } catch (error) {
            console.error(`Error or timeout checking service: ${service.name}`, error);
        } finally {
            this.checkingStatus.set(service.name, false);
        }
    }
    async runChecksWithTimeout() {
        this.endpoints.forEach((service: any) => {
            if (!this.checkingStatus.get(service.name)) {
                this.checkServiceWithTimeout(service);
            }
        });
    }
    startPeriodicChecks() {
        this.runChecksWithTimeout();

        setInterval(() => this.runChecksWithTimeout(), 120000); // Run checks every 5 minutes
    }
}

module.exports = HealthChecker;
