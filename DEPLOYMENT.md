# Deployment Guide for Render

This guide will help you deploy the Money Management application on Render.

## Prerequisites

1. GitHub account with the repository: https://github.com/Shubhamkumarpatel70/moneymanage.git
2. Render account (sign up at https://render.com)
3. MongoDB Atlas account (or use Render's MongoDB service)

## Step 1: Set up MongoDB Database

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP address (use `0.0.0.0/0` for Render)
5. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)

### Option B: Render MongoDB

1. In Render dashboard, click "New +" → "MongoDB"
2. Create a MongoDB instance
3. Get the connection string from the service dashboard

## Step 2: Deploy on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign in or create an account

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"

3. **Connect Repository**
   - Click "Connect account" if not already connected
   - Select GitHub account
   - Find and select repository: `Shubhamkumarpatel70/moneymanage`
   - Click "Connect"

4. **Configure Service**
   - **Name**: `money-management` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: 
     ```
     npm run install-all && cd client && npm run build
     ```
   - **Start Command**: 
     ```
     cd server && npm start
     ```

5. **Set Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   
   - **NODE_ENV** = `production`
   - **PORT** = `5000` (or leave empty, Render will assign)
   - **MONGODB_URI** = Your MongoDB connection string
   - **JWT_SECRET** = A secure random string (e.g., generate with: `openssl rand -base64 32`)

6. **Deploy**
   - Click "Create Web Service"
   - Render will start building and deploying your application
   - This may take 5-10 minutes

## Step 3: Verify Deployment

1. Once deployment is complete, you'll get a URL like: `https://money-management.onrender.com`
2. Visit the URL to verify the application is running
3. Test the application:
   - Register a new user
   - Login
   - Create customers and transactions

## Important Notes

### Environment Variables
- Never commit `.env` files to GitHub
- All sensitive data should be in Render's environment variables
- The `MONGODB_URI` should include your database credentials

### Build Process
- Render will automatically:
  1. Install all dependencies (server and client)
  2. Build the React app (`client/build`)
  3. Start the Express server
  4. Serve the React app from the server in production mode

### Static Files
- The server is configured to serve the built React app from `client/build`
- All API routes are prefixed with `/api`
- React Router will handle client-side routing

### Auto-Deploy
- Render will automatically redeploy when you push to the `main` branch
- You can disable auto-deploy in service settings if needed

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Application Not Loading
- Check server logs in Render dashboard
- Verify MongoDB connection string is correct
- Ensure all environment variables are set

### API Calls Failing
- Check if API routes are working: `https://your-app.onrender.com/api/auth/me`
- Verify CORS settings (already configured)
- Check network tab in browser console

### Database Connection Issues
- Verify MongoDB URI is correct
- Check if IP whitelist includes Render's IPs (use `0.0.0.0/0` for MongoDB Atlas)
- Ensure database user has proper permissions

## Updating the Application

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. Render will automatically detect the push and redeploy

## Support

For issues with:
- **Render**: Check Render documentation or support
- **Application**: Check application logs in Render dashboard
- **MongoDB**: Check MongoDB Atlas dashboard or documentation

