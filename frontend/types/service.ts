
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
    uptimePercentage?: number;
    last10services: {
        name: string;
        status: ServiceStatus;
    }[];
}

interface ServicesData {
    services: Service[];
}


export type {
    ServiceLabel,
    ServiceStatus,
    Service,
    ServicesData
}