# BudgetBloom

A personal finance tracker application built with Node.js and Express.js.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd budget-bloom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/budgetbloom
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Access the Swagger documentation at `http://localhost:3000/api-docs` to test the API endpoints.

## API Endpoints

- **Register User**: `POST /api/auth/register`
- **Login User**: `POST /api/auth/login`
- **Logout User**: `POST /api/auth/logout`
- **Get Current User**: `GET /api/auth/me`
- **Update User Profile**: `PUT /api/auth/me`
- **Change Password**: `PUT /api/auth/password`
- **Request Password Reset**: `POST /api/auth/password/reset`

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- Swagger for API documentation 