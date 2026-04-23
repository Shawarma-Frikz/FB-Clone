import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "./components/AuthLayout";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomeFeedPage from "./pages/HomeFeedPage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import ChatPage from "./pages/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { loadCurrentUser } from "./features/auth/authSlice";

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (accessToken) {
      dispatch(loadCurrentUser());
    }
  }, [accessToken, dispatch]);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to="/app" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/app" replace /> : <RegisterPage />} />
      </Route>

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="feed" replace />} />
        <Route path="feed" element={<HomeFeedPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="/" element={<Navigate to={user ? "/app" : "/login"} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;