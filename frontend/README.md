# Shardeum Status Page UI

This is a Next.js app that fetches data from the Shardeum Status Server on Prometheus and displays it visually to give users a good insight into the health of our network.

## Getting Started
To get started working with this project locally, follow these steps:

* Clone the repository - `git clone https://github.com/shardeum/network-status.git`
* Change into the frontend directory - `cd frontend`
* Install dependencies - `npm install`
* Run the dev server - `npm run dev` - This should start the Next.js dev server and open the app on port 3000. 
* Open http://localhost:3000 to view the project in the browser

> Note: The app will not function properly without the status server running on port 9090 and feeding data to Prometheus. Please refer  to the README in the backend folder to set that up first.
