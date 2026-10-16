# CarryGoExpress - Fast & Reliable Electronics E-Commerce

CarryGoExpress is a modern, high-performance electronics e-commerce web platform built with **React**, **Vite**, **Tailwind CSS**, and a **Supabase Realtime** backend.

---

## 🚀 Key Features

- **Storefront**:
  - CarryGoExpress catalog with category filtering (Televisions, Audio, Projectors, Headphones, Monitors, Smart Home).
  - Search, sorting, dynamic badges, product details, and rich media galleries.
  - Cart drawer and checkout powered by Paystack & wallet payments.
  - Dedicated user profile, orders history, and wallet top-ups.
  - Support contact without phone friction (support email & nationwide fulfillment hubs).

- **Admin Control Center (`/admin`)**:
  - Accessible directly at the `/admin` route.
  - **Live Realtime Tracking**: Postgres Realtime WebSocket subscription channels for instant updates on orders, product catalog, user signups, and financial transactions.
  - **Real-Time KPIs**: Total Revenue, Today's Sales, Realtime Orders queue, Catalog size, Low Stock alerts, and Registered Customers.
  - **Live Activity Feed**: Event ticker displaying incoming orders, customer signups, and stock changes as they happen.
  - **Product Catalog Manager**: Full CRUD with inline inventory stock quick adjustments (`+` / `-`), status toggles, and 1-click starter catalog seeder.
  - **Order Lifecycle Management**: Order status progression (`Pending`, `Processing`, `Delivered`, `Cancelled`) with customer & item details.
  - **User & Restrictions Management**: View customer spend, role assignments (`Admin` / `Customer`), and account suspensions.
  - **Financial Ledger**: Real-time deposit and debit transaction logs.

---

## 🎨 Tech Stack & Architecture

- **Frontend**: Vite 5, React 18, Tailwind CSS, Lucide Icons, Framer Motion, Recharts
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Auth, Storage, Postgres Realtime)
- **State Management**: Zustand
- **Payments**: Paystack Inline integration + CarryGoExpress Wallet Ledger

---

## 📦 Installation & Local Setup

```bash
# Clone the repository
git clone https://github.com/nasco247/CarryGoExpress.git
cd CarryGoExpress

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase URL & Anon Key:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Start the local development server
npm run dev

# Build for production
npm run build
```

---

## 🗄️ Database Setup (Supabase)

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor**.
3. Copy and run the entire [supabase_schema.sql](./supabase_schema.sql) file.
4. The script automatically:
   - Sets up all 7 tables: `products`, `orders`, `order_items`, `profiles`, `transactions`, `carts`, and `app_events`.
   - Enables Row Level Security (RLS) with policies for customers and administrators.
   - Adds tables to `supabase_realtime` publication for instant admin live streaming.
   - Seeds the starter CarryGoExpress product catalog.

---

## 🛡️ Admin Access

1. Navigate to `/login`.
2. Click **"Demo Admin Access"** or sign in with an account having `role: 'admin'` in `profiles` or `user_metadata`.
3. You will be redirected immediately to the `/admin` real-time command center.

---

## 📄 License

MIT License. Designed & developed for CarryGoExpress.
