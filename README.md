# Task Rewards - Investment & Earning Platform

A full-stack web application where users can invest in packages, complete tasks, and earn money. Features a referral system where users earn 10 rupees for each successful referral.

## Features

- **4 Investment Packages**: Basic, Silver, Gold, and Platinum
- **Task Completion System**: Complete daily tasks to earn rewards
- **Referral System**: Earn ₨10 for every successful referral
- **Multiple Payment Methods**: NayaPay, Bank Transfer, Raast ID, Zindigi App
- **Withdrawal System**: Request withdrawals with multiple payment options
- **User Dashboard**: Track earnings, tasks, and referrals

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React.js
- React Router
- Axios for API calls
- Context API for state management

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-reward-app
JWT_SECRET=your_jwt_secret_key_change_this_in_production
REFERRAL_BONUS=10
```

4. Seed the database with packages and tasks:
```bash
npm run seed
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on http://localhost:3000

## Usage

### For Users

1. **Register**: Create an account (optionally with a referral code)
2. **Choose Package**: Select and purchase an investment package
3. **Complete Tasks**: Do daily tasks based on your package tier
4. **Earn Rewards**: Get paid for each completed task
5. **Refer Friends**: Share your referral code to earn ₨10 per referral
6. **Withdraw**: Request withdrawals once you have sufficient balance

### Payment Methods

When purchasing a package, users can pay via:
- **NayaPay**: Mobile wallet payment
- **Bank Transfer**: Direct bank account transfer
- **Raast ID**: Instant payment using Raast
- **Zindigi App**: JS Bank's digital wallet

### Package Details

| Package | Price | Tasks/Day | Reward/Task | Duration | Total Earnings | Profit | ROI |
|---------|-------|-----------|-------------|----------|----------------|--------|-----|
| Basic | ₨500 | 3 | ₨10 | 30 days | ₨900 | ₨400 | 80% |
| Silver | ₨1,000 | 6 | ₨10 | 30 days | ₨1,800 | ₨800 | 80% |
| Gold | ₨2,000 | 12 | ₨10 | 30 days | ₨3,600 | ₨1,600 | 80% |
| Platinum | ₨3,500 | 21 | ₨10 | 30 days | ₨6,300 | ₨2,800 | 80% |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/referrals` - Get user's referrals

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages/:id` - Get single package
- `POST /api/packages/purchase` - Purchase a package
- `POST /api/packages/create` - Create package (Admin)

### Tasks
- `GET /api/tasks/available` - Get available tasks for user
- `POST /api/tasks/start` - Start a task
- `POST /api/tasks/complete` - Complete a task
- `GET /api/tasks/history` - Get task history
- `POST /api/tasks/create` - Create task (Admin)
- `GET /api/tasks/all` - Get all tasks

### Withdrawals
- `POST /api/withdrawals/request` - Request withdrawal
- `GET /api/withdrawals` - Get user's withdrawals
- `GET /api/withdrawals/all` - Get all withdrawals (Admin)
- `PUT /api/withdrawals/status` - Update withdrawal status (Admin)

### Transactions
- `GET /api/transactions` - Get user's transactions
- `GET /api/transactions/stats` - Get transaction statistics

## Database Models

- **User**: User accounts with wallet and referral data
- **Package**: Investment packages
- **Task**: Available tasks
- **UserTask**: User's task completions
- **Transaction**: All financial transactions
- **Withdrawal**: Withdrawal requests

## Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Protected API routes
- Input validation
- CORS enabled

## Future Enhancements

- Admin dashboard for managing users, packages, and withdrawals
- Email notifications
- Real payment gateway integration
- Mobile app
- Task verification system
- Analytics and reports

## License

MIT

## Support

For support, email support@taskrewards.com or join our WhatsApp community.
