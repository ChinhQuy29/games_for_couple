import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="wobble text-7xl">🦆</div>
      <h1 className="font-display text-3xl font-extrabold">This page waddled away</h1>
      <Link to="/" className="btn btn-pink">
        Back to the games
      </Link>
    </main>
  );
}
