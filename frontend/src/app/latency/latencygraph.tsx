"use client";
import Chart from "react-apexcharts";
export default function LatencyGraph({ data, name }: Readonly<{ data: any, name: string }>) {

    const details = {
        chart: {
            id: name,
            type: "line",
            animations: {
                enabled: true,
                easing: 'linear',
                dynamicAnimation: {
                    speed: 2000
                }
            },

        },

        xaxis: {
            categories: [] as string[],

        },
        yaxis: [
            {
                axisBorder: {
                    show: true,
                    color: "#247BA0"
                },
                title: {
                    text: "Response time (s)",
                    style: {
                        color: "#247BA0",
                        fontSize: '10px',
                        fontFamily: undefined,
                    }
                }
            }
        ],

        stroke: {
            curve: 'straight',
        },
        title: {
            text: name,
            align: 'left'
        },
        colors: [
            "#387537",
            "#1d12f7",
            "#d4526e",
            "#f63e8b",
            "#872871",
            "#38513d",
            "#13d8aa",
            "#A5978B",
            "#2b908f",
            "#f9a3a4",
            "#90ee7e",
            "#f48024",
            "#69d2e7"
        ],
    };

    const series: any[] = [];

    const dataSeries = data.forEach((service: any) => {
        series.push({
            name: service.name,
            data: service.last10services.map((service: any) => service.status.labels.duration)
        })
    })

    const xAxis = data[0].last10services.map((service: any) => {
        const dateTime = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
        }).format(Number(service.status.labels.timestamp))

        details.xaxis.categories?.push(dateTime);
    });


    return (
        <div className="mb-16">
            <Chart options={details as any} series={series} type="line" height={520} />
        </div>
    )
}