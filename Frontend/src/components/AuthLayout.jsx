import { Outlet, Link } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-[#f0f2f5] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-2xl">
          <div className="text-5xl font-black tracking-tight text-[#1877f2] sm:text-6xl lg:text-7xl">FB Social</div>
          <p className="mt-4 max-w-xl text-xl leading-8 text-[#1c1e21] sm:text-2xl sm:leading-9">
            Connect with friends and the world around you.
          </p>
        </div>
      </section>

      <main className="flex flex-col justify-center gap-5 px-6 py-10 sm:px-10 lg:px-14">
        <Outlet />
        <footer className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#65676b]">
          <Link className="transition hover:text-[#1877f2]" to="/login">
            Login
          </Link>
          <Link className="transition hover:text-[#1877f2]" to="/register">
            Create account
          </Link>
        </footer>
      </main>
    </div>
  );
}

export default AuthLayout;