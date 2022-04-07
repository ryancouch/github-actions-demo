# Base image
FROM node:12

# Create app directory
WORKDIR /app

# Copy over package.json
COPY package.json /app
COPY package-lock.json /app

# Install app dependencies
RUN npm ci

# Bundle app source
COPY . /app


CMD ["npm", "start"]