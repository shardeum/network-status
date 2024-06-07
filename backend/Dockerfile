# Use an official Node.js image as a base image
FROM node:18.17.0

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3002
EXPOSE 3002

# Command to run the backend server
CMD ["npm", "start"]
