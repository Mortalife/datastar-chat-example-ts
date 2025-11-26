# Chat Example with DataStar

This repository contains a real-time chat application built using DataStar, Hono, and SQLite. It demonstrates how to create a modern, reactive web application with server-side rendering and real-time updates.

## Features

- Real-time chat functionality
- User authentication and session management
- Server-side rendering with Hono
- Client-side interactivity with DataStar
- SQLite database for data persistence
- Docker support for easy deployment

## Prerequisites

- Node.js (v24)
- pnpm
- Docker (for containerized deployment)

## Getting Started

1. Clone the repository:

```sh
git clone cd chat-example-data-star
```

2. Install dependencies:

```sh
pnpm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory and add necessary environment variables (e.g., `DATABASE_PATH`, `SESSION_SECRET`).

4. Run the development server:

```sh
pnpm dev
```

5. In a separate terminal, run the Vite development server:

```sh
pnpm vite-dev
```

6. Open your browser and navigate to `http://localhost:3000` to see the application running.

## Building for Production

To build the application for production:

```sh
pnpm build
```

This command will build both the client-side assets and the server-side code.

## Docker Deployment

To run the application using Docker:

1. Build the Docker image:

```sh
docker build -t chat-example .
```

2. Run the container:

```sh
docker run -p 3000:3000 -v ./data:/usr/src/app/data chat-example
```

Alternatively, use Docker Compose:

```sh
docker-compose up
```

## Database Management

To explore the SQLite database:

```sh
pnpm db
```

This will open the Outerbase Studio for database management.

## Project Structure

- `src/`: Source code for the application
  - `index.ts`: Main entry point
  - `templates/`: Server-side rendering templates
  - `social/`: Chat and user activity logic
  - [sse/](cci:1://file:///src/templates/helpers.ts:0:0-1:36): Server-Sent Events implementation
  - `lib/`: Utility functions and database connection
- `public/`: Static assets
- `dist/`: Built files (generated)

## Technologies Used

- [Hono](https://hono.dev/): Lightweight web framework
- [DataStar](https://github.com/starfederation/datastar): Reactive data binding library
- [SQLite](https://www.sqlite.org/): Embedded database (LibSQL)
- [Vite](https://vitejs.dev/): Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework
- [DaisyUI](https://daisyui.com/): Tailwind CSS component library

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
