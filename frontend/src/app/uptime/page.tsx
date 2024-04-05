interface ServiceLabel {
    __name__: string;
    duration: string;
    help: string;
    instance: string;
    job: string;
    name: string;
    timestamp?: string;
    url: string;
}

interface ServiceStatus {
    value: number;
    labels: ServiceLabel;
}

interface Service {
    name: string;
    status: ServiceStatus;
    last10services: {
        name: string;
        status: ServiceStatus;
    }[];
}

interface ServicesData {
    services: Service[];

}

async function fetchStatus(): Promise<ServicesData> {
    // Define start, end, and step parameters for your query range
    const start = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    // start from 2 days ago
    // const start = Math.floor(Date.now() / 1000) - 172800; // 2 days ago
    const end = Math.floor(Date.now() / 1000); // now
    const step = 60; // 60 seconds
    const query = encodeURIComponent('Shardeum')
    // http://localhost:9090/api/v1/query_range?query=Shardeum&start=1712241719&end=1712245371&step=60
    try {
        const url = process.env.NEXT_PUBLIC_PROMETHEUS_URL_RANGE + `?query=${query}&start=${start}&end=${end}&step=${step}`
        console.log(url);

        const response = await fetch(url, {
            next: {
                revalidate: 5,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }

        const jsonResponse = await response.json();

        const services: Service[] = jsonResponse.data.result.map((item: any) => ({
            name: item.metric.name,
            status: {
                value: parseInt(item.values[0][1], 10),
                labels: item.metric,
            },
            last10services: []
        }));

        const latestServicesData = getLast10LatestServices(services);

        return latestServicesData;
    } catch (error) {
        console.error('Error fetching status:', error);
        throw error;
    }
}

function getLast10LatestServices(services: Service[]): ServicesData {
    const latestServicesMap: Record<string, Service[]> = {};

    services.forEach(service => {
        const serviceName = service.name;
        if (!latestServicesMap[serviceName]) {
            latestServicesMap[serviceName] = [];
        }
        latestServicesMap[serviceName].push(service);
    });

    Object.keys(latestServicesMap).forEach(serviceName => {
        latestServicesMap[serviceName].sort((a, b) => {
            const timestampA = parseInt(a.status.labels.timestamp || '0', 10);
            const timestampB = parseInt(b.status.labels.timestamp || '0', 10);
            return timestampA - timestampB;
        });
        latestServicesMap[serviceName] = latestServicesMap[serviceName].slice(0, 60);
    });

    const formattedServices: Service[] = [];
    Object.keys(latestServicesMap).forEach(serviceName => {
        const latestService = latestServicesMap[serviceName][latestServicesMap[serviceName].length - 1];
        const last10services = latestServicesMap[serviceName].map(service => ({
            name: service.name,
            status: service.status
        }));
        formattedServices.push({
            name: serviceName,
            status: latestService.status,
            last10services: last10services
        });
    });

    return { services: formattedServices };
}
export default async function Home() {
    const data = await fetchStatus()
    const { services } = data;

    return (
        <main className="flex flex-col items-center p-24 bg-white">
            <h1 className="text-black font-regular my-2 text-xl text-left justify-start w-full max-w-[930px]">Current Network Status</h1>
            <div className="flex w-full max-w-[930px] h-full gap-2 gap-y-5 p-2 items-center flex-wrap">

                {services.map((service: Service, index: any) => (
                    <div key={index} className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow flex justify-between">
                        <div className="flex flex-col flex-1">
                            <h5 className="mb-2 text-black text-xl font-bold tracking-tight">{service.name}</h5>
                            <p className="font-normal text-gray-700 ">{service.status.value === 1 ? 'Operational' : 'Offline'}</p>
                            <div className="w-full flex gap-1 mt-5">

                                {service.last10services.map((lastService) => {
                                    const dateTime = new Intl.DateTimeFormat('en-US', {
                                        year: 'numeric',
                                        month: 'numeric',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        second: 'numeric'
                                    }).format(Number(lastService.status.labels.timestamp))

                                    return (
                                        <div
                                            className={`has-tooltip w-[10px] h-full flex ${lastService.status.value === 1 ? 'bg-green-500' : 'bg-red-500'}`}
                                            key={lastService.name} >
                                            <span className='tooltip rounded shadow-lg p-1 bg-gray-100 text-orange-950 -mt-8'>{dateTime}</span>
                                            &nbsp;
                                        </div>
                                    )
                                }
                                )}
                            </div>
                        </div>
                        <div className="inline-flex items-center">
                            <label className="relative flex items-center p-3 rounded-full cursor-pointer" htmlFor="amber">
                                {
                                    service.status.value === 1 ? (
                                        <input type="checkbox"
                                            className="before:content[''] peer relative h-5 w-5 rounded-full cursor-pointer appearance-none  border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-green-500 checked:bg-green-500 checked:before:bg-green-500 hover:before:opacity-10"
                                            id="amber" checked readOnly />
                                    ) : (
                                        <input type="checkbox"
                                            className="before:content[''] peer relative h-5 w-5 rounded-full cursor-pointer appearance-none  border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-red-500 checked:bg-red-500 checked:before:bg-red-500 hover:before:opacity-10"
                                            id="amber" checked readOnly />
                                    )
                                }
                                <span
                                    className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"
                                        stroke="currentColor" strokeWidth="1">
                                        <path fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"></path>
                                    </svg>
                                </span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </main >
    );
}