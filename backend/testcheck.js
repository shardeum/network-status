import fetch from 'node-fetch';

class ServiceChecker {
    constructor(servicesConfig) {
        this.servicesConfig = servicesConfig;
    }
    async checkService(service) {
        try {
            const options = { method: 'GET', headers: {} };
            if (service.body) {
                options.method = 'POST';
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(service.body);
            }
            const response = await fetch(service.url, options);
            const statusOk = response.status >= 200 && response.status < 300;

            let isExpectedResponseIncluded = false;

            if (typeof service.response === 'string') {
                // Handle string responses
                let body = await response.text();
                body = body.toLowerCase().trim();
                const expected = service.response.toLowerCase().trim();
                isExpectedResponseIncluded = body.includes(expected);
            } else {
                // Handle JSON responses with specific keys/values expected
                const body = await response.json(); // Assuming the response is JSON
                isExpectedResponseIncluded = this.checkJsonResponse(body, service.response);
            }

            console.log(`${service.name} is ${statusOk && isExpectedResponseIncluded ? 'online' : 'offline'}`);
        } catch (error) {
            console.error(`Error checking service ${service.name} at ${service.url}:`, error);
        }
    }

    /**
     * Checks if the expected keys/values are present in the JSON response.
     * @param {Object} actualResponse - The actual JSON response body.
     * @param {Object} expectedResponse - The expected keys/values.
     * @returns {boolean} - True if the expected keys/values are present, false otherwise.
     */
    checkJsonResponse(actualResponse, expectedResponse) {
        for (const key of Object.keys(expectedResponse)) {
            if (!actualResponse.hasOwnProperty(key)) {
                return false; // Key not found in the response
            }
            // If the expected value is an object, recursively check for expected properties
            if (typeof expectedResponse[key] === 'object' && !Array.isArray(expectedResponse[key])) {
                if (!this.checkJsonResponse(actualResponse[key], expectedResponse[key])) {
                    return false;
                }
            } else if (Array.isArray(expectedResponse[key])) {
                // If the expected value is an array, you might check for its presence or length
                // For this example, let's just check the key exists and it's an array
                if (!Array.isArray(actualResponse[key]) || actualResponse[key].length === 0) {
                    return false;
                }
            } else {
                // For simple value checks
                if (actualResponse[key] !== expectedResponse[key]) {
                    return false;
                }
            }
        }
        return true; // All checks passed
    }
    async checkAllServices() {
        for (const service of this.servicesConfig) {
            await this.checkService(service);
        }
    }
}

const servicesConfig = [
    {
        url: 'http://172.105.153.160:4000/nodelist',
        name: 'Archiver 1',
        help: 'This is the first Archiver server',
        response: {
            nodeList: [{}, {}],
            sign: {
                owner: '7af699dd711074eb96a8d1103e32b589e511613ebb0c6a789a9e8791b2b05f34',
            }
        }
    },
    {
        url: 'http://172.105.153.160:4000/nodelistfaddada',
        name: 'Archiver 2',
        help: 'This is the second Archiver server',
        response: "nodelist"
    },
    {
        url: 'http://50.116.18.184:3000/summary',
        name: 'Monitor 1',
        help: 'This is the first Monitor server',
        response: "Ascending"
    },
    {
        url: 'http://72.14.184.233:8080',
        name: 'JSON-RPC Server',
        help: 'This is the first JSON-RPC server',
        body: { jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 73 },
        response: { jsonrpc: '2.0', id: 73, }
    },
    {
        url: 'https://explorer-sphinx.shardeum.org/',
        name: 'Explorer',
        help: 'This is the Shardeum Explorer',
        response: "The Shardeum Betanet Explorer"
    },
    {
        url: 'https://shardeum.org/',
        name: 'Website',
        help: 'This is the Shardeum Website',
        response: "Shardeum | EVM based Sharded Layer 1 Blockchain"
    },
    {
        url: 'https://docs.shardeum.org/',
        name: 'Documentation',
        help: 'This is the Shardeum Documentation',
        response: "Shardeum is a dynamic state sharded EVM-based L1 with low transaction fees forever"
    }
];

const checker = new ServiceChecker(servicesConfig);
checker.checkAllServices();