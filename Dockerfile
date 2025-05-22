# Step 1: Use Node.js base image
FROM node:18-alpine

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy everything else
COPY . .

# Step 6: Build the React app
RUN npm run build

# Step 7: Install 'serve' to serve the production build
RUN npm install -g serve

# Step 8: Expose port 3000
EXPOSE 3000

# Step 9: Start the app
CMD ["serve", "-s", "build", "-l", "3000"]
