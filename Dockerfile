# node-app/Dockerfile
FROM node:20-alpine

# Install the shadow package to get useradd
RUN apk add --no-cache shadow

# Create a non-root user
RUN useradd -m appuser

# Set the working directory
WORKDIR /usr/src/app

# Copy only the package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Change ownership of the application directory
RUN chown -R appuser:appuser /usr/src/app

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "src/main.js"]
