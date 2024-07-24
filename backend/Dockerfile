# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install Prometheus
RUN apt-get update && apt-get install -y prometheus

# Copy the Prometheus configuration file
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Expose the ports the app runs on
EXPOSE 3002 9090

# Start both the Node.js application and Prometheus
CMD ["entry.sh"]