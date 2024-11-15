'use client'
import { fetchStatus } from "../../../api/fetchstatus";
import { Service } from "../../../types/service";
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic'

export default async function Home() {
    const data = await fetchStatus(60)
    const { services } = data;

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Format time consistently using users's timezone
    const formatTimeToLocal = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString(undefined, { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        }).toLowerCase();
    };

    // Format date with time for tooltips
    const formatDateTimeToLocal = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <main className="flex flex-col items-center p-4 sm:p-8 md:p-16 lg:p-24 bg-white">
            <h1 className="text-black font-regular my-2 text-lg sm:text-xl text-left justify-start w-full max-w-[930px]">Uptime Monitor</h1>
            <div className="flex w-full max-w-[930px] h-full gap-2 gap-y-3 sm:gap-y-5 p-2 items-center flex-wrap">
                {services.map((service: Service, index: any) => {
                    const last24HourServices = service.last10services.filter(s => 
                        Number(s.status.labels.timestamp) > twentyFourHoursAgo
                    );

                    return (
                    <div className="w-full p-3 sm:p-4 md:p-6 bg-white border border-gray-200 rounded-lg shadow" key={index + service.name} >
                        <h5 className="text-black text-base sm:text-lg md:text-xl font-bold tracking-tight">{service.name}</h5>
                        <div className="flex justify-between">
                            <div className="flex flex-col flex-1">
                                <div className="w-full flex gap-[1px] mt-2 px-2 sm:px-4">
                                    <div className="w-[95%] flex gap-[0.5px] sm:gap-[1px]">
                                        {last24HourServices.map((lastService, index) => {
                                            const timestamp = Number(lastService.status.labels.timestamp);
                                            return (
                                            <div
                                                className={`has-tooltip flex-1 h-full cursor-pointer ${
                                                lastService.status.value === 1 ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                                key={lastService.name + index}
                                                style={{ minWidth: '1px' }}
                                                onClick={() => {
                                                alert(
                                                    `Status: ${
                                                    lastService.status.value === 1 ? 'Up' : 'Down'
                                                    }\n` +
                                                    `Time: ${formatDateTimeToLocal(timestamp)}\n` +
                                                    `${
                                                        lastService.status.value === 0
                                                        ? 'Error: Service was unreachable'
                                                        : 'Service was operating normally'
                                                    }`
                                                );
                                                }}
                                            >
                                                <span className="tooltip rounded shadow-lg p-1 bg-gray-100 text-orange-950 -mt-8 text-xs sm:text-sm">
                                                {formatDateTimeToLocal(timestamp)}
                                                </span>
                                                &nbsp;
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex w-full justify-between items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                            <div className="item light legend-item-date-range">
                                <span className="availability-time-line-legend-day-count">
                                    {formatDistanceToNow(new Date(Number(last24HourServices[0]?.status.labels.timestamp)))} ago 
                                </span>
                            </div>
                            <div className="spacer border h-[0.5px] flex-1"></div>
                            <div className="legend-item legend-item-uptime-value whitespace-nowrap">
                                <span id="font-bold">
                                    <var data-var="uptime-percent">
                                        {(last24HourServices.filter(s => s.status.value === 1).length / last24HourServices.length * 100).toFixed(2)}
                                    </var>
                                </span>
                                % uptime
                            </div>
                            <div className="spacer border h-[0.5px] flex-1"></div>
                            <div className="legend-item light legend-item-date-range">
                                {formatTimeToLocal(Date.now())}
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </main>
    );
}