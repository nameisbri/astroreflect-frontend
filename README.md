# AstroReflect Frontend

AstroReflect is a personal astrology transit journal application that allows users to track astrological transits and record their reflections. This repository contains the frontend React application.

## Overview

The AstroReflect frontend provides an intuitive interface for:

- Viewing astrological transits on a calendar
- Exploring detailed transit information based on Swiss Ephemeris calculations
- Creating and managing journal entries linked to transits
- Viewing planetary positions, aspects, and retrograde periods

## Tech Stack

- **React**: UI component framework
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast development environment
- **SCSS**: Styling with variables and mixins
- **React Router**: Client-side routing

The application connects to a backend that uses the **Swiss Ephemeris** library for accurate astrological calculations, providing precise planetary positions and transits.

## Color Palette

AstroReflect uses a custom color palette:

- **Palatinate (#5c164e)**: Primary
- **Coral (#ef8354)**: Accent
- **Hooker's Green (#517664)**: Secondary
- **Silver (#bfc0c0)**: Neutral
- **White (#ffffff)**: Background

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/astroreflect-frontend.git
   cd astroreflect-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file:

   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_APP_NAME=AstroReflect
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser to `http://localhost:5173`

## Building

To build the app for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Page components
├── services/         # API and data services
├── styles/           # Global styles and SCSS variables
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── App.tsx           # Root component
└── main.tsx          # Entry point
```

## Backend API

This frontend connects to the [AstroReflect API](https://github.com/yourusername/astroreflect-api) for transit data and journal functionality. Make sure the API is running locally or provide the correct endpoint in your `.env` file.
