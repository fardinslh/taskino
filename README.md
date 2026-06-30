# Taskino Frontend

A Persian, RTL dashboard for managing projects, tasks, teams, leave requests, reports, and supervisor workflows.

## Built With

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Hook Form

## Getting Started

```bash
pnpm install
pnpm dev
```

The development server runs at [http://localhost:3001](http://localhost:3001).

## Configuration

Set the backend API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
GROQ_API_KEY=your_groq_api_key
```

If it is not set, the application uses the URL above by default.

Create a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys).
The key is used only by the server-side assistant route and is never exposed to
the browser. You can optionally set `GROQ_MODEL` to another Groq model ID.

## Commands

```bash
pnpm lint
pnpm build
pnpm start
```
