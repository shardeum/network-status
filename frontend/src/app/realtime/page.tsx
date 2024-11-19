import { Service } from "../../../types/service";
import { fetchStatus } from "../../../api/fetchstatus";
export const dynamic = 'force-dynamic'
export default async function RealtimeStatus() {
  const data = await fetchStatus()
  const { services } = data;

  return (
    <main className="flex flex-col items-center p-4 sm:p-8 md:p-16 lg:p-24 bg-white">
      <h1 className="text-black font-regular my-2 text-lg sm:text-xl text-left justify-start w-full max-w-[930px]">Current Network Status</h1>
      <div className="flex w-full max-w-[930px] h-full gap-2 gap-y-5 p-2 items-center flex-wrap">

        {services.map((service: Service, index: any) => (
          <div key={index} className="w-full sm:w-[450px] p-3 sm:p-4 md:p-6 bg-white border border-gray-200 rounded-lg shadow flex justify-between">
            <div className="flex flex-col">
              <h5 className="mb-2 text-black text-lg sm:text-xl font-bold tracking-tight">{service.name}</h5>
              <p className="font-normal text-sm sm:text-base text-gray-700">{service.status.value === 1 ? 'Operational' : 'Offline'}</p>
            </div>
            <div className="inline-flex items-center">
              <label className="relative flex items-center p-2 sm:p-3 rounded-full cursor-pointer" htmlFor="amber">
                {
                  service.status.value === 1 ? (
                    <input type="checkbox"
                      className="before:content[''] peer relative h-4 w-4 sm:h-5 sm:w-5 rounded-full cursor-pointer appearance-none border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-green-500 checked:bg-green-500 checked:before:bg-green-500 hover:before:opacity-10"
                      id="amber" checked readOnly />
                  ) : (
                    <input type="checkbox"
                      className="before:content[''] peer relative h-4 w-4 sm:h-5 sm:w-5 rounded-full cursor-pointer appearance-none border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-red-500 checked:bg-red-500 checked:before:bg-red-500 hover:before:opacity-10"
                      id="amber" checked readOnly />
                  )
                }
                <span
                  className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor"
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
    </main>
  );
}