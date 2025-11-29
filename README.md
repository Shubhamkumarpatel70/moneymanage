# Money Management Application

A full-stack MERN (MongoDB, Express.js, React, Node.js) application for managing money transactions, customers, and payments.

## Features

- User authentication (Password and MPIN)
- Customer management
- Transaction tracking (Received/Given)
- Payment methods (UPI ID, QR Code)
- Payment processing with proof upload
- Share transaction history via secure links
- Admin dashboard for managing users and transactions
- Account deletion requests
- Multi-language support (English, Hinglish)
- Responsive design with Tailwind CSS
- PWA support

## Tech Stack

- **Frontend**: React, React Router, Tailwind CSS, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT, bcrypt

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Shubhamkumarpatel70/moneymanage.git
cd moneymanage
```

2. Install dependencies:
```bash
npm run install-all
```

3. Create a `.env` file in the `server` directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

4. Run the application:
```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
npm run server  # Runs backend on port 5000
npm run client  # Runs frontend on port 3000
```

## Deployment on Render

### Prerequisites
- Render account
- MongoDB Atlas account (or Render MongoDB service)

### Steps

1. **Push to GitHub** (already done):
   - Repository: https://github.com/Shubhamkumarpatel70/moneymanage.git

2. **Create MongoDB Database**:
   - Go to MongoDB Atlas or use Render's MongoDB service
   - Create a database and get the connection string

3. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Shubhamkumarpatel70/moneymanage`
   - Configure the service:
     - **Name**: money-management
     - **Environment**: Node
     - **Build Command**: `npm run install-all && cd client && npm run build`
     - **Start Command**: `cd server && npm start`
     - **Root Directory**: (leave empty)

4. **Environment Variables**:
   Add these in Render dashboard:
   - `NODE_ENV` = `production`
   - `PORT` = `5000` (or let Render assign)
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = a secure random string

5. **Static Files**:
   - Render will automatically serve the built React app from `client/build`
   - The server is configured to serve static files in production

6. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy your application
   - Your app will be available at: `https://your-app-name.onrender.com`

## Project Structure

```
money-management/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
├── server/                 # Express backend
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── index.js
│   └── package.json
├── package.json           # Root package.json
├── render.yaml            # Render deployment config
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password/verify` - Verify account for password reset
- `POST /api/auth/forgot-password/reset` - Reset password/MPIN

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get transaction summary

### Payments
- `GET /api/payments` - Get user payments
- `POST /api/payments/:id/approve` - Approve payment
- `POST /api/payments/:id/reject` - Reject payment

## License

ISC

## Author

Shubhamkumarpatel70
