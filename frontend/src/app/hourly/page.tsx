

'use client'
import { fetchHistoricalStatus } from "../../../api/fetchhistoricalstatus";
import { Service } from "../../../types/service";
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic'

export default async function HourlyStatus() {
    const data = await fetchHistoricalStatus(720, 'hourly');
    const { services } = data;

    // Calculate timestamp for 30 days ago
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    // Format date with time for tooltips
    const formatDateTimeToLocal = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            hour12: true
        });
    };

    // Format date for display
    const formatDateToLocal = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <main className="flex flex-col items-center p-4 sm:p-8 md:p-16 lg:p-24 bg-white">
            <h1 className="text-black font-regular my-2 text-lg sm:text-xl text-left justify-start w-full max-w-[930px]">Hourly Uptime Monitor</h1>
            <div className="flex w-full max-w-[930px] h-full gap-2 gap-y-3 sm:gap-y-5 p-2 items-center flex-wrap">
                {services.map((service: Service, index: any) => {
                    const last30DaysServices = service.last10services.filter(s => 
                        Number(s.status.labels.timestamp) > thirtyDaysAgo
                    );

                    return (
                    <div className="w-full p-3 sm:p-4 md:p-6 bg-white border border-gray-200 rounded-lg shadow" key={index + service.name} >
                        <h5 className="text-black text-base sm:text-lg md:text-xl font-bold tracking-tight">{service.name}</h5>
                        <div className="flex justify-between">
                            <div className="flex flex-col flex-1">
                                <div className="w-full flex gap-[1px] mt-2 px-2 sm:px-4">
                                    <div className="w-[95%] flex gap-[0.5px] sm:gap-[1px]">
                                        {last30DaysServices.map((lastService, index) => {
                                            const timestamp = Number(lastService.status.labels.timestamp);
                                            return (
                                            <div
                                                className={`has-tooltip flex-1 h-6 cursor-pointer ${
                                                lastService.status.value === 1 ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                                key={lastService.name + index}
                                                style={{ minWidth: '2px' }}
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
                                    {formatDateToLocal(Number(last30DaysServices[0]?.status.labels.timestamp))}
                                </span>
                            </div>
                            <div className="spacer border h-[0.5px] flex-1"></div>
                            <div className="legend-item legend-item-uptime-value whitespace-nowrap">
                                <span id="font-bold">
                                    <var data-var="uptime-percent">
                                        {(last30DaysServices.filter(s => s.status.value === 1).length / last30DaysServices.length * 100).toFixed(2)}
                                    </var>
                                </span>
                                % uptime
                            </div>
                            <div className="spacer border h-[0.5px] flex-1"></div>
                            <div className="legend-item light legend-item-date-range">
                                {formatDateToLocal(Date.now())}
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </main>
    );
}