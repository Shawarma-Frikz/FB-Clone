import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="glass-panel max-w-lg rounded-3xl p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Not found</p>
        <h1 className="mt-3 text-5xl font-black text-white">404</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          The page you are looking for does not exist or was moved.
        </p>
        <Link className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" to="/app/feed">
          Back to feed
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;