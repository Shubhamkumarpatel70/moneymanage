# Money Management MERN Application

A full-stack money management application built with MongoDB, Express, React, and Node.js. This application helps users track their financial transactions with customers, similar to Khatabook.

## Features

- **User Authentication**
  - Registration with name, phone number, password, and MPIN
  - Login with email/phone number using password or MPIN
  - Default user role is admin

- **Customer Management**
  - Add new customers with name and mobile number
  - View all customers on dashboard
  - Navigate to customer-specific transaction pages

- **Transaction Management**
  - Add transactions (You Gave / You Received)
  - View transaction history with date, time, and balance
  - Track total spent, received, and current balance
  - Khatabook-like UI design

- **Dashboard**
  - Summary cards showing total received, total given, and current balance
  - Customer list with quick navigation
  - Modern, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React, React Router, Tailwind CSS, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Installation

1. **Install dependencies for both server and client:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   - Create a `.env` file in the `server` directory:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/money-management
     JWT_SECRET=your-secret-key-change-in-production
     ```

3. **Make sure MongoDB is running:**
   - Install MongoDB if not already installed
   - Start MongoDB service

4. **Run the application:**
   ```bash
   npm run dev
   ```
   This will start both the server (port 5000) and client (port 3000) concurrently.

## Project Structure

```
money-management/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Customer.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── customers.js
│   │   └── transactions.js
│   ├── middleware/
│   │   └── auth.js
│   ├── index.js
│   └── package.json
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Customers
- `GET /api/customers` - Get all customers (protected)
- `POST /api/customers` - Add new customer (protected)
- `GET /api/customers/:id` - Get single customer (protected)
- `DELETE /api/customers/:id` - Delete customer (protected)

### Transactions
- `GET /api/transactions` - Get all transactions (protected)
- `GET /api/transactions/customer/:customerId` - Get customer transactions (protected)
- `POST /api/transactions` - Add new transaction (protected)
- `GET /api/transactions/summary` - Get summary (protected)
- `DELETE /api/transactions/:id` - Delete transaction (protected)

## Usage

1. **Register a new account** with your name, phone number, password, and MPIN
2. **Login** using your email/phone number with password or MPIN
3. **Add customers** from the dashboard
4. **Click on a customer** to view/add transactions
5. **Add transactions** using the "AAPNE DIYE" (You Gave) or "AAPKO MILE" (You Received) buttons
6. **View your summary** on the dashboard with total received, given, and current balance

## Notes

- Default user role is set to "admin" during registration
- MPIN must be between 4-6 digits
- All transactions are automatically calculated with balance tracking
- The UI is designed to be similar to Khatabook with a clean, modern interface

