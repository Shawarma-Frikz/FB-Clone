import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../features/auth/authSlice";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginUser(formData));

    if (loginUser.fulfilled.match(result)) {
      navigate("/app", { replace: true });
    }
  };

  return (
    <section className="mx-auto w-full max-w-md">
      <div className="rounded-xl border border-[#dce1e8] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.08)] sm:p-6">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-lg border border-[#dce1e8] px-4 py-3 text-[17px] text-[#1c1e21] outline-none transition placeholder:text-[#65676b] focus:border-[#b8d5ff] focus:ring-4 focus:ring-[#1877f2]/20"
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email address"
            autoComplete="email"
            required
          />

          <input
            className="w-full rounded-lg border border-[#dce1e8] px-4 py-3 text-[17px] text-[#1c1e21] outline-none transition placeholder:text-[#65676b] focus:border-[#b8d5ff] focus:ring-4 focus:ring-[#1877f2]/20"
            type="password"
            value={formData.password}
            onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password"
            autoComplete="current-password"
            required
          />

          <button
            className="mt-1 w-full rounded-lg bg-[#1877f2] px-4 py-3 text-[1.1rem] font-bold text-white transition hover:bg-[#166fe5]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          {error ? <p className="text-center text-sm text-[#d93025]">{error}</p> : null}

          <button
            className="mt-1 text-sm font-medium text-[#1877f2] transition hover:text-[#166fe5]"
            type="button"
          >
            Forgotten password?
          </button>

          <div className="my-1 border-t border-[#dce1e8]" />

          <div className="flex justify-center">
            <Link
              className="rounded-lg bg-[#42b72a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#36a420]"
              to="/register"
            >
              Create new account
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;