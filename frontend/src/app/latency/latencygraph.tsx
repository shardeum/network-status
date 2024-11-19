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
            type: 'datetime',
            labels: {
                datetimeUTC: false,
                formatter: function(value: string) {
                    return new Date(Number(value)).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            }
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
        tooltip: {
            x: {
                formatter: function(value: number) {
                    return new Date(value).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            }
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

    data.forEach((service: any) => {
        // Only include services that have duration data
        const serviceData = service.last10services
            .filter((s: any) => s.status.labels.duration !== undefined)
            .map((s: any) => ({
                x: new Date(Number(s.status.labels.timestamp)).getTime(),
                y: Number(s.status.labels.duration).toFixed(2)
            }));

        if (serviceData.length > 0) {
            series.push({
                name: service.name,
                data: serviceData
            });
        }
    });

    return (
        <div className="mb-16">
            <Chart options={details as any} series={series} type="line" height={520} />
        </div>
    );
}