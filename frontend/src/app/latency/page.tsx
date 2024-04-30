import { fetchStatus } from "../../../api";
import { Service } from "../../../types/service";
import dynamic from "next/dynamic";
const LatencyGraph = dynamic(() => import("../latency/latencygraph"), { ssr: false });


export default async function Home() {
    const data = await fetchStatus(10)
    const { services } = data;

    const serverServicesName = ["monitor", "json-rpc", "archiver"];
    const websiteServicesName = ["documentation", "explorer", "website"];

    const serverServices = [] as Service[];
    const websiteServices = [] as Service[];

    services.forEach(service => {
        const serviceNameLower = service.name.toLowerCase();

        serverServicesName.forEach(serverServiceName => {
            if (serviceNameLower.includes(serverServiceName.toLowerCase())) {
                serverServices.push(service);
            }
        });

        websiteServicesName.forEach(websiteServiceName => {
            if (serviceNameLower.includes(websiteServiceName.toLowerCase())) {
                websiteServices.push(service);
            }
        });
    });


    return (
        <main className="flex flex-col items-center p-24 bg-white">
            <div className="max-w-4xl w-full">
                <h1 className="text-black font-regular my-2 text-xl text-left justify-start w-full max-w-[930px]">Latency Graph</h1>
                <LatencyGraph data={serverServices} name={"Server services"} />
                <LatencyGraph data={websiteServices} name={"Website services"} />
            </div>
        </main>
    );
}