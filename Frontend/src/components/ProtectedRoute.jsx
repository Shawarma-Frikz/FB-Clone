import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, accessToken, loading } = useSelector((state) => state.auth);

  if (accessToken && !user && loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Restoring your session...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;