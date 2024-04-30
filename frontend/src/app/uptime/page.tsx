import { fetchStatus } from "../../../api/fetchstatus";
import { Service } from "../../../types/service";

export default async function Home() {
    const data = await fetchStatus(62)
    const { services } = data;

    return (
        <main className="flex flex-col items-center p-24 bg-white">
            <h1 className="text-black font-regular my-2 text-xl text-left justify-start w-full max-w-[930px]">Uptime Monitor</h1>
            <div className="flex w-full max-w-[930px] h-full gap-2 gap-y-5 p-2 items-center flex-wrap">
                {services.map((service: Service, index: any) => (
                    <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow" key={index + service.name} >
                        <h5 className=" text-black text-xl font-bold tracking-tight">{service.name}</h5>
                        <div className=" flex justify-between">
                            <div className="flex flex-col flex-1">
                                <div className="w-full flex gap-1 mt-2">
                                    {service.last10services.map((lastService, index) => {
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
                                                key={lastService.name + index} >
                                                {/* <span className='tooltip rounded shadow-lg p-1 bg-gray-100 text-orange-950 -mt-8'>{dateTime}</span> */}
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
                        <div className="mt-2 flex w-full justify-between items-center gap-2">

                            <div className="item light legend-item-date-range">
                                <span className="availability-time-line-legend-day-count">1</span> hour ago
                            </div>
                            <div className="spacer border h-[0.5px] flex-1"></div>
                            <div className="legend-item legend-item-uptime-value legend-item-pc5t8fy4tf59">
                                <span id="font-bold">
                                    <var data-var="uptime-percent">{Number(service.uptimePercentage).toFixed(2)}</var>
                                </span>
                                % uptime
                            </div>
                            <div className="spacer border  h-[0.5px] flex-1"></div>
                            <div className="legend-item light legend-item-date-range">Today</div>
                        </div>
                    </div>
                ))}
            </div>
        </main >
    );
}