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

# Expose port 3000
EXPOSE 3000

# Command to run the frontend server
CMD ["npm", "run", "dev"]
