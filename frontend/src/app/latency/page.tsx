import { fetchStatus } from "../../../api";
import { Service } from "../../../types/service";
import dynamic from "next/dynamic";
const LatencyGraph = dynamic(() => import("../latency/latencygraph"), { ssr: false });


export default async function Home() {
    const data = await fetchStatus()
    const { services } = data;

    const serverServicesName = ["monitor", "json-rpc", "archiver", "faucet"];
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
        <main className="flex flex-col items-center p-4 sm:p-8 md:p-16 lg:p-24 bg-white">
            <div className="w-full max-w-4xl px-2 sm:px-4">
                <h1 className="text-black font-regular my-2 text-lg sm:text-xl text-left justify-start w-full">Latency Graph</h1>
                <div className="space-y-4 sm:space-y-6">
                    <LatencyGraph data={serverServices} name={"Server services"} />
                    <LatencyGraph data={websiteServices} name={"Website services"} />
                </div>
            </div>
        </main>
    );
}