const prometheus = require('prom-client');
const axios = require('axios');

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
class HealthChecker {
    static instance: HealthChecker;
    endpoints: (Group | Endpoint)[] = [];
    serverHealth: any;
    isChecking: boolean = false;
    serviceHealthGauge: any;

    constructor() {
        if (HealthChecker.instance) {
            return HealthChecker.instance;
        }
        const loadedEndpoints = require('../../endpoints.json');
        this.endpoints = this.flattenEndpoints(loadedEndpoints.urls);
        this.isChecking = false;
        this.startPeriodicChecks();
        // Initialize Prometheus metrics
        this.serviceHealthGauge = new prometheus.Gauge({
            name: 'Shardeum',
            help: 'Current health status of services (1 = online, 0 = offline)',
            labelNames: ['name', 'duration', 'last_checked'],
        });
    }

    flattenEndpoints(urls: any[]) {
        return urls.flatMap(endpoint => 'servers' in endpoint ? endpoint.servers : [endpoint]);
    }
    // Perform service checks
    async checkService(service: any) {
        const startTime = new Date().getTime();
        const { url, body, name } = service;
        console.log('Checking service:', name, url, body);
        try {
            const response = body ? await axios.post(url, body) : await axios.get(url);
            const durationInSeconds = (Date.now() - startTime) / 1000;
            this.serviceHealthGauge.labels(name, durationInSeconds, Date.now()).set(1);
            return { name, status: 'online', lastChecked: new Date() };

        } catch (error: any) {
            console.log('Error checking service:' + name, error.code);
            const durationInSeconds = (Date.now() - startTime) / 1000;
            this.serviceHealthGauge.labels(name, durationInSeconds, Date.now()).set(0);
            return { name, status: 'offline', lastChecked: new Date(), error };
        }
    }

    // Run checks with timeout
    async runChecksWithTimeout() {
        if (!this.isChecking) {
            this.isChecking = true;
            const timeoutId = setTimeout(() => {
                console.error('Service checks timed out!');
                this.isChecking = false;
            }, 30000); // Any ongoing checks should not take longer than 30 seconds

            const promises = this.endpoints.map(service => this.checkService(service));
            try {
                const results = await Promise.all(promises);
                this.updateServerHealth(results);
            } catch (error) {
                console.error('Error during checks:', error);
            } finally {
                this.isChecking = false;
                clearTimeout(timeoutId);
            }
        }
    }

    // Update server health based on check results
    updateServerHealth(results: any[]) {
        this.serverHealth = results;
        console.log('Server health updated:', this.serverHealth);
    }

    getServerHealth() {
        if (!this.serverHealth) {
            return 'Health checks in progress';
        }
        return this.serverHealth;
    }

    // Start periodic health checks
    startPeriodicChecks() {
        this.runChecksWithTimeout();
        setInterval(() => {
            if (!this.isChecking) {
                this.runChecksWithTimeout();
            }
        }, 50000); // Run checks every 50 seconds
    }

}

module.exports = HealthChecker;
