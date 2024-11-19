
import { Service, ServicesData } from "../types/service";

export async function fetchHistoricalStatus(noOfService = 720, pageType: 'hourly' | 'daily' = 'hourly'): Promise<ServicesData> {
    // Configure time parameters based on the page type
    const timeConfig = {
        'hourly': {
            window: 30 * 24 * 60 * 60, // 30 days 
            step: 3600, // 1-hour intervals
            defaultServices: 720 // 30 days * 24 hours
        },
        'daily': {
            window: 30 * 24 * 60 * 60, // 30 days 
            step: 86400, // 24-hour (daily) intervals
            defaultServices: 30 // 30 days
        }
    };

    const config = timeConfig[pageType];
    const serviceCount = noOfService || config.defaultServices;
    
    // Fetch data from Prometheus
    const response = await fetchPrometheusData(config.window, config.step);
    
    // Map response to services array
    const services = mapToServices(response.data.result);
    
    // Process data according to the page type
    const latestServicesData = pageType === 'daily'
        ? getDailyServicesData(services, serviceCount)
        : getAggregatedServicesData(services, serviceCount);
    
    return latestServicesData;
}

async function fetchPrometheusData(timeWindow: number, step: number) {
    const start = Math.floor(Date.now() / 1000) - timeWindow;
    const end = Math.floor(Date.now() / 1000);
    const query = encodeURIComponent('Shardeum');
    const url = process.env.NEXT_PUBLIC_PROMETHEUS_URL_RANGE + `?query=${query}&start=${start}&end=${end}&step=${step}`;
    
    try {
        const response = await fetch(url, {
            next: {
                revalidate: step,
            },
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.log('Error fetching status:', error);
        return { data: { result: [] } };
    }
}

function mapToServices(data: any): Service[] {
    return data.flatMap((item: any) => {
        // Map each value to a service with proper timestamp
        return item.values.map((value: any) => ({
            name: item.metric.name,
            status: {
                value: parseInt(value[1], 10),
                labels: {
                    ...item.metric,
                    timestamp: value[0] * 1000 // Convert to milliseconds
                }
            },
            last10services: []
        }));
    });
}

// For 5-hour detailed view with 5-minute intervals
function getDetailedServicesData(services: Service[], limit: number): ServicesData {
    const intervalMap = new Map();
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Group services by name first
    const servicesByName = new Map();
    services.forEach(service => {
        if (!servicesByName.has(service.name)) {
            servicesByName.set(service.name, []);
        }
        servicesByName.get(service.name).push(service);
    });

    const latestServices: any[] = [];

    // Process each service separately
    servicesByName.forEach((serviceList, serviceName) => {
        // Clear the interval map for each service
        intervalMap.clear();

        // Group status updates by 5-minute intervals
        serviceList.forEach((service: any) => {
            const timestamp = Number(service.status.labels.timestamp);
            // Round down to nearest 5-minute interval
            const intervalKey = Math.floor(timestamp / FIVE_MINUTES) * FIVE_MINUTES;
            
            if (!intervalMap.has(intervalKey)) {
                intervalMap.set(intervalKey, {
                    name: service.name,
                    status: service.status,
                    timestamp: intervalKey
                });
            }
        });

        // Convert map to array and sort by timestamp
        const serviceIntervals = Array.from(intervalMap.values())
            .sort((a, b) => a.timestamp - b.timestamp);

        // Take only the required number of most recent intervals
        const recentServices = serviceIntervals.slice(-limit);

        // Calculate uptime percentage
        const uptime = calculateUptimePercentage(recentServices);

        latestServices.push({
            name: serviceName,
            status: recentServices[recentServices.length - 1]?.status || serviceList[serviceList.length - 1].status,
            uptimePercentage: uptime,
            last10services: recentServices
        });
    });

    return {
        services: latestServices
    };
}

// For 30-day view with hourly intervals
function getAggregatedServicesData(services: Service[], limit: number): ServicesData {
    const hourlyServicesMap = new Map();
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Group services by name first
    const servicesByName = new Map();
    services.forEach(service => {
        if (!servicesByName.has(service.name)) {
            servicesByName.set(service.name, []);
        }
        servicesByName.get(service.name).push(service);
    });

    const latestServices: any[] = [];

    // Process each service separately
    servicesByName.forEach((serviceList, serviceName) => {
        // Clear the interval map for each service
        hourlyServicesMap.clear();

        // Group status updates by hourly intervals
        serviceList.forEach((service: any) => {
            const timestamp = Number(service.status.labels.timestamp);
            // Round down to nearest hour
            const intervalKey = Math.floor(timestamp / ONE_HOUR) * ONE_HOUR;
            
            if (!hourlyServicesMap.has(intervalKey)) {
                hourlyServicesMap.set(intervalKey, {
                    name: service.name,
                    status: service.status,
                    timestamp: intervalKey
                });
            }
        });

        // Convert map to array and sort by timestamp
        const serviceIntervals = Array.from(hourlyServicesMap.values())
            .sort((a, b) => a.timestamp - b.timestamp);

        // Take only the required number of most recent intervals
        const recentServices = serviceIntervals.slice(-limit);

        // Calculate uptime percentage
        const uptime = calculateUptimePercentage(recentServices);

        latestServices.push({
            name: serviceName,
            status: recentServices[recentServices.length - 1]?.status || serviceList[serviceList.length - 1].status,
            uptimePercentage: uptime,
            last10services: recentServices
        });
    });

    return {
        services: latestServices
    };
}
// For 30-day view with daily intervals
function getDailyServicesData(services: Service[], limit: number): ServicesData {
    const dailyServicesMap = new Map();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Group services by name first
    const servicesByName = new Map();
    services.forEach(service => {
        if (!servicesByName.has(service.name)) {
            servicesByName.set(service.name, []);
        }
        servicesByName.get(service.name).push(service);
    });

    const latestServices: any[] = [];

    // Process each service separately
    servicesByName.forEach((serviceList, serviceName) => {
        // Clear the interval map for each service
        dailyServicesMap.clear();

        // Group status updates by daily intervals
        serviceList.forEach((service: any) => {
            const timestamp = Number(service.status.labels.timestamp);
            // Round down to nearest day (midnight UTC)
            const intervalKey = Math.floor(timestamp / ONE_DAY) * ONE_DAY;
            
            if (!dailyServicesMap.has(intervalKey)) {
                dailyServicesMap.set(intervalKey, {
                    name: service.name,
                    timestamp: intervalKey,
                    dataPoints: [], // Store all status points for the day
                    totalMinutesChecked: 0,
                    downMinutes: 0
                });
            }
            
            const dayData = dailyServicesMap.get(intervalKey);
            dayData.dataPoints.push({
                timestamp: timestamp,
                value: service.status.value
            });

            // Sort dataPoints by timestamp to calculate time differences
            dayData.dataPoints.sort((a: any, b: any) => a.timestamp - b.timestamp);
        });

        // Process each day's data to calculate actual uptime
        dailyServicesMap.forEach((dayData, timestamp) => {
            let totalMinutes = 0;
            let downMinutes = 0;

            // Calculate time spans between data points
            for (let i = 0; i < dayData.dataPoints.length; i++) {
                const currentPoint = dayData.dataPoints[i];
                const nextPoint = dayData.dataPoints[i + 1];
                
                let timeSpan;
                if (nextPoint) {
                    timeSpan = (nextPoint.timestamp - currentPoint.timestamp) / (60 * 1000); // Convert to minutes
                } else {
                    // For the last point, assume it represents the next 5 minutes (or your check interval)
                    timeSpan = 5;
                }

                totalMinutes += timeSpan;
                if (currentPoint.value === 0) {
                    downMinutes += timeSpan;
                }
            }

            const uptimePercentage = ((totalMinutes - downMinutes) / totalMinutes) * 100;

            // A day is considered "down" if:
            // 1. Uptime is less than 99% (more than ~14 minutes of downtime), or
            // 2. There was a significant continuous downtime period (e.g., > 10 minutes)
            let significantDowntime = false;
            let currentDowntime = 0;
            let maxDowntime = 0;

            dayData.dataPoints.forEach((point: any, index: number) => {
                if (point.value === 0) {
                    const nextPoint = dayData.dataPoints[index + 1];
                    if (nextPoint) {
                        currentDowntime += (nextPoint.timestamp - point.timestamp) / (60 * 1000);
                    }
                    maxDowntime = Math.max(maxDowntime, currentDowntime);
                } else {
                    currentDowntime = 0;
                }
            });

            significantDowntime = maxDowntime >= 10; // 10 minutes of continuous downtime

            // Update the day's final status
            dayData.status = {
                value: (uptimePercentage >= 99 && !significantDowntime) ? 1 : 0,
                labels: {
                    name: dayData.name,
                    timestamp: dayData.timestamp,
                    uptimePercentage: uptimePercentage.toFixed(2),
                    totalMinutes: totalMinutes,
                    downMinutes: downMinutes.toFixed(1),
                    maxContinuousDowntime: maxDowntime.toFixed(1),
                    details: generateDayStatusDetails(dayData, uptimePercentage, downMinutes, maxDowntime)
                }
            };
        });

        // Convert to array and sort by timestamp
        const dailyStatuses = Array.from(dailyServicesMap.values())
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(dayData => ({
                name: dayData.name,
                status: dayData.status
            }));

        const recentServices = dailyStatuses.slice(-limit);
        const uptime = calculateDailyUptimePercentage(recentServices as Service[]);

        latestServices.push({
            name: serviceName,
            status: recentServices[recentServices.length - 1]?.status || serviceList[serviceList.length - 1].status,
            uptimePercentage: uptime,
            last10services: recentServices
        });
    });

    return {
        services: latestServices
    };
}

function calculateDailyUptimePercentage(services: Service[]): number {
    if (!services.length) return 0;
    
    // Use the uptimePercentage from the labels
    let totalUptime = 0;
    let validDays = 0;

    services.forEach((service: any) => {
        const uptimePercent = parseFloat(service.status.labels.uptimePercentage || '0');
        if (!isNaN(uptimePercent)) {
            totalUptime += uptimePercent;
            validDays++;
        }
    });
    
    return validDays > 0 ? totalUptime / validDays : 0;
}

function generateDayStatusDetails(dayData: any, uptimePercentage: number, downMinutes: number, maxDowntime: number): string {
    const date = new Date(dayData.timestamp).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `Date: ${date}\n` +
           `Daily Uptime: ${uptimePercentage.toFixed(2)}%\n` +
           `Total Downtime: ${downMinutes.toFixed(1)} minutes\n` +
           `Longest Continuous Downtime: ${maxDowntime.toFixed(1)} minutes`;
}

function calculateUptimePercentage(services: Service[]): number {
    if (!services.length) return 0;
    const uptimeCount = services.filter(service => service.status.value === 1).length;
    return (uptimeCount / services.length) * 100;
}