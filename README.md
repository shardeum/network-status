# Shardeum Network Monitoring Project

This repository is designed to monitor the status of the Shardeum Network services.
It provides users with information about the health of the Shardeum network, uptime, and latency.

![Shardeum network status](https://res.cloudinary.com/kennyy/image/upload/v1716044789/CleanShot_2024-05-18_at_19.05.34_2x_kliwxi.png)


### Prerequisites.
* To get started, ensure you have `Node.js` installed preferably v18+ 
* Adhere to the requirements of each submodule (frontend & backend)

### Installation

#### Clone the Network Status Repository.
   
First, clone the Shardeum network status repository to your local machine.


```
git clone https://github.com/shardeum/network-status.git
```

#### Install the required dependencies for the frontend and backend:
 For the backend,
 
 ```bash
 cd backend
 npm i
 ```
    
This will install all the dependencies required for the backend project (i.e Node.js server)

To start the local development server for the backend project, run the following command:

```
npm start
```

This will start the local Node server on port `3002` (or your locally specified port). 

> Your Prometheus server should be running on port 9090  [how to set up Prometheus](https://github.com/shardeum/network-status/tree/main/backend#run-prometheus)
> 

For the frontend project, change directory into the front end directory and install the dependencies as well.

```
cd ..
cd frontend
npm i
```
Start the frontend server by running the following command:

```
npm run dev
```
to start testing the network services locally.