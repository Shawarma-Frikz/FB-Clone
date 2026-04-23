import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../features/auth/authSlice";

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (!Object.keys(nextErrors).length) {
      const payload = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      const result = await dispatch(registerUser(payload));

      if (registerUser.fulfilled.match(result)) {
        navigate("/app", { replace: true });
      }
    }
  };

  return (
    <section className="mx-auto w-full max-w-md">
      <div className="ds-modal-enter relative rounded-xl border border-[#dce1e8] bg-white p-5 shadow-[0_12px_28px_rgba(16,24,40,0.12)] sm:p-6">
        <button
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#e4e6eb] text-lg font-semibold text-[#606770] transition hover:bg-[#d8dbe2]"
          type="button"
          onClick={() => navigate("/login")}
          aria-label="Close"
        >
          ×
        </button>

        <div className="pr-10">
          <h2 className="text-3xl font-bold leading-tight text-[#1c1e21]">Create a new account</h2>
          <p className="mt-1 text-sm text-[#65676b]">It's quick and easy.</p>
        </div>

        <div className="my-4 border-t border-[#dadde1]" />

        <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <input
                className="w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] text-[#1c1e21] outline-none transition placeholder:text-[#8d949e] focus:border-[#b8d5ff] focus:bg-white focus:ring-4 focus:ring-[#1877f2]/20"
                type="text"
                value={formData.firstName}
                onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))}
                placeholder="First name"
                autoComplete="given-name"
              />
              {errors.firstName ? <p className="mt-1 text-xs text-[#c62828]">{errors.firstName}</p> : null}
            </div>

            <div>
              <input
                className="w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] text-[#1c1e21] outline-none transition placeholder:text-[#8d949e] focus:border-[#b8d5ff] focus:bg-white focus:ring-4 focus:ring-[#1877f2]/20"
                type="text"
                value={formData.lastName}
                onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))}
                placeholder="Last name"
                autoComplete="family-name"
              />
              {errors.lastName ? <p className="mt-1 text-xs text-[#c62828]">{errors.lastName}</p> : null}
            </div>
          </div>

          <div>
            <input
              className="w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] text-[#1c1e21] outline-none transition placeholder:text-[#8d949e] focus:border-[#b8d5ff] focus:bg-white focus:ring-4 focus:ring-[#1877f2]/20"
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              autoComplete="email"
            />
            {errors.email ? <p className="mt-1 text-xs text-[#c62828]">{errors.email}</p> : null}
          </div>

          <div>
            <input
              className="w-full rounded-lg border border-[#ccd0d5] bg-[#f5f6f7] px-3 py-2.5 text-[15px] text-[#1c1e21] outline-none transition placeholder:text-[#8d949e] focus:border-[#b8d5ff] focus:bg-white focus:ring-4 focus:ring-[#1877f2]/20"
              type="password"
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              placeholder="New password"
              autoComplete="new-password"
            />
            {errors.password ? <p className="mt-1 text-xs text-[#c62828]">{errors.password}</p> : null}
          </div>

          <div className="mt-2 flex justify-center">
            <button
              className="rounded-lg bg-[#42b72a] px-8 py-2.5 text-base font-bold text-white transition hover:bg-[#36a420]"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </div>

          {error ? <p className="text-center text-sm text-[#d93025]">{error}</p> : null}

          <p className="text-center text-sm text-[#65676b]">
            Already have an account? <Link className="font-medium text-[#1877f2] hover:text-[#166fe5]" to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;