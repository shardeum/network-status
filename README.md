# Shardeum Network Monitoring Project

This repository is designed to monitor the status of the Shardeum Network services.
It provides users with information about the health of the Shardeum network, uptime, and latency.

![Shardeum network status](https://res.cloudinary.com/kennyy/image/upload/v1716044789/CleanShot_2024-05-18_at_19.05.34_2x_kliwxi.png)


### Prerequisites.
* To get started, ensure you have `Node.js` installed preferably v18+ 
* Adhere to the requirements of each submodule (frontend & backend)

### Monitored Services
The services we monitor are defined in [the endpoints.json](https://github.com/shardeum/network-status/blob/main/backend/endpoints.json) file which contains the URLs of each service along with their expected response structures.

### Installation

#### Clone the Network Status Repository.

First, clone the Shardeum network status repository to your local machine.


```
git clone https://github.com/shardeum/network-status.git
```

#### Install the required dependencies for the frontend and backend:
**For the backend**,

 ```bash
 cd backend
 npm i
 ```

This will install all the dependencies required for the backend project (i.e Node.js server)

To start the local development server for the backend project, run the following command:

```bash
npm start
```

This will start the local Node server on port `3002` (or your locally specified port). 

> Your Prometheus server should be running on port 9090  [how to set up Prometheus](https://github.com/shardeum/network-status/tree/main/backend#run-prometheus)
> 
**For the frontend,** 

Change directory into the frontend directory and install the dependencies.

```bash
cd ..
cd frontend
npm i
```
#### Set up environment variables
Next, copy over the contents of [.env.example](https://github.com/shardeum/network-status/blob/main/frontend/.env.example) to your local `.env` file in the frontend directory.

#### Run the project
Start the frontend server by running the following command:

```bash
npm run dev
```

This will start the local development server for the frontend project on port `3000` (or your locally specified port).
