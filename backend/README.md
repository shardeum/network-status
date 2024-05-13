# Shardeum Status Server

This is a Node server that monitors the Shardeum network on a set interval and feeds the data to Prometheus (A time series database we are using to store metrics).
The services and their expected responses are contained in the `endpoints.jsoon` file within the backend folder.

## Running it locally

To run this server locally, follow these steps:

* Clone the repository with `git clone https://github.com/shardeum/network-status.git`
* Change into the backend directory with `cd backend`
* Install the dependencies with `npm install`
* Run the local dev server with: `npm start`
* This should start the server on port 3002 from where it will feed data to Prometheus.


## Run Prometheus
Prometheus is also required to scrape metrics from the server. To run Prometheus locally:
* Download the prometheus binary for your local machine from https://prometheus.io/
* Extract the contents of the zip file to access the prometheus executable
* Open the `prometheus.yml` file in the root directory and update with the contents of the `prometheus.yml` in this project
* Lastly, run the prometheus executable with: `./prometheus`

Prometheus should now ping your local server on the specified port based on the configuration in the yml file.