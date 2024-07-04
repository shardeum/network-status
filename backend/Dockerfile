# Stage 1: Build the Node.js application
FROM node:18.17.0 AS node-builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Stage 2: Set up Prometheus with custom config
FROM prom/prometheus:v2.47.0

# Create the Prometheus configuration file
RUN echo 'global:' > /etc/prometheus/prometheus.yml && \
    echo '  scrape_interval: 60s' >> /etc/prometheus/prometheus.yml && \
    echo 'scrape_configs:' >> /etc/prometheus/prometheus.yml && \
    echo '  - job_name: '"'"'shardeum_services'"'" >> /etc/prometheus/prometheus.yml && \
    echo '    static_configs:' >> /etc/prometheus/prometheus.yml && \
    echo '      - targets: ['"'"'127.0.0.1:3002'"'"']' >> /etc/prometheus/prometheus.yml

# Copy the Node.js application from the previous stage
COPY --from=node-builder /app /app

# Set working directory for the Node.js app
WORKDIR /app

# Expose ports for Prometheus and your Node.js application
EXPOSE 9090 3002

# Command to run both Prometheus and your Node.js app
CMD ["/usr/local/bin/start.sh"]