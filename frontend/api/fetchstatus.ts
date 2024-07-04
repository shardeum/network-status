import { Service, ServicesData } from "../types/service";

export async function fetchStatus(noOfService = 10): Promise<ServicesData> {
    // Fetch data from Prometheus
    const response = await fetchPrometheusData();
    // Map response to services array
    const services = mapToServices(response.data.result);
    // Get last N services and transform
    const latestServicesData = getLatestServicesData(services, noOfService);
    return latestServicesData;
}

async function fetchPrometheusData() {
    // Define start, end, and step parameters for prometheus query range
    const start = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const end = Math.floor(Date.now() / 1000); // now
    const step = 60; // 60 seconds
    const query = encodeURIComponent('Shardeum');
    const url = process.env.NEXT_PUBLIC_PROMETHEUS_URL_RANGE + `?query=${query}&start=${start}&end=${end}&step=${step}`;
    const response = await fetch(url, {
        next: {
            revalidate: 5,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
    }
    return await response.json();
}

function mapToServices(data: any): Service[] {
    return data.map((item: any) => ({
        name: item.metric.name,
        status: {
            value: parseInt(item.values[0][1], 10),
            labels: item.metric,
        },
        last10services: []
    }));
}

function getLatestServicesData(services: Service[], limit: number): ServicesData {
    const latestServicesMap = new Map();
    services.forEach(service => {
        let serviceHistory = latestServicesMap.get(service.name) || [];
        serviceHistory.push(service);
        latestServicesMap.set(service.name, serviceHistory);
    });

    const latestServices: any[] = [];
    latestServicesMap.forEach((serviceHistory, name) => {
        serviceHistory.sort((a: any, b: any) => parseInt(a.status.labels.timestamp || '0') - parseInt(b.status.labels.timestamp || '0'))
        const recentServices = serviceHistory.slice(-limit);
        const uptime = calculateUptimePercentage(recentServices);
        latestServices.push({
            name,
            status: recentServices[recentServices.length - 1].status,
            uptimePercentage: uptime,
            last10services: recentServices
        });
    });
    return {
        services: latestServices
    };
}

function calculateUptimePercentage(services: Service[]): number {
    const uptimeCount = services.filter(service => service.status.value === 1).length;
    return (uptimeCount / services.length) * 100;
}
