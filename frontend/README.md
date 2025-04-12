# Orthotics Portal Frontend

This is the frontend application for the Orthotics Portal, built with React.js.

## Features

- User authentication
- Patient management
- Prescription creation and management
- Order tracking
- Invoice viewing
- Template management
- Responsive design

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Development Setup

### Using Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed.
2. From the project root, run:

```bash
docker-compose up -d
```

This will start the frontend, backend, database, and Redis services.

### Manual Setup

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Configure environment variables:

   - Copy `.env.example` to `.env` and edit as needed.

3. Start the development server:

```bash
npm start
# or
yarn start
```

4. Open http://localhost:3000 in your browser.

## Building for Production

```bash
npm run build
# or
yarn build
```

This will create an optimized production build in the `build` folder.

## Running Tests

```bash
npm test
# or
yarn test
```

## Project Structure

```
frontend/
├── css/                # CSS stylesheets
├── html/               # HTML templates
├── js/                 # JavaScript files
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── store/          # State management
│   └── utils/          # Utility functions
├── images/             # Static images
├── package.json        # Dependencies and scripts
└── Dockerfile          # Docker configuration
```

## Adding New Features

When adding new features or components, please:

1. Follow the established project structure
2. Use consistent naming conventions
3. Add appropriate tests
4. Ensure responsive design

## Code Style

This project follows the Airbnb JavaScript Style Guide. We use ESLint and Prettier to enforce code style.

## Browser Support

The application is designed to work with the following browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
