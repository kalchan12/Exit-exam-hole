# CS Prep - Gamified Exam Preparation Platform

A frontend-only, static web application designed to help Computer Science students prepare for exams using gamified practice and progress tracking.

## 🚀 Features

- **Gamified Learning**: Earn XP, build up your daily streak, and level up as you answer questions correctly.
- **Topic Mastery**: Track your accuracy across core CS topics (Algorithms, Operating Systems, Database Systems, Networking).
- **Daily Challenge**: A randomized daily set of questions to keep your streak alive.
- **Study Notes**: Searchable, topic-filtered study notes with expandable key points.
- **Weak Topic Detection**: Automatically highlights areas where your accuracy is below 50% so you can focus your studies.
- **Local Persistence**: All progress (XP, streaks, accuracy, answered questions) is securely stored in your browser's `localStorage` and restored automatically.
- **Dark/Light Mode**: Full theme support matching modern premium design aesthetics.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, built for static export)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + robust `localStorage` implementation
- **Data Source**: Local JSON files (ready to be easily swapped with a backend API in the future)

## 📁 Project Structure highlights

- `src/app/`: Next.js App Router pages (Dashboard, Questions, Notes, Stats).
- `src/components/`: Reusable UI components (Sidebar, ThemeProvider).
- `src/lib/`: Core logic modules
  - `dataLoader.ts`: Abstracted data fetching layer.
  - `progressManager.ts`: Safe `localStorage` CRUD operations.
  - `gamification.ts`: Logic for XP calculation, daily challenges, and topic mastery.
- `public/data/`: The static JSON database (`questions.json`, `notes.json`).

## 🧱 Future-Ready Architecture

The app is built entirely without a backend to ensure it runs statically anywhere. However, it is designed with a clean abstraction layer (`dataLoader.ts`) so that migrating to a full-stack architecture (e.g., PostgreSQL + REST API) in the future is as simple as updating the data-fetching functions.

## 🏃‍♂️ Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```

3. **Open the App**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for Production (Static Export)**:
   ```bash
   npm run build
   ```
   *The optimized static HTML/JS will be generated in the `out/` directory.*
