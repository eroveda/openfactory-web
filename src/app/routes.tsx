import { createBrowserRouter, Navigate } from "react-router";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { WorkspaceList } from "./pages/WorkspaceList";
import { Profile } from "./pages/Profile";
import { WorkspaceDefine } from "./pages/WorkspaceDefine";
import { WorkspaceShape } from "./pages/WorkspaceShape";
import { WorkspaceBox } from "./pages/WorkspaceBox";
import { UsageAdmin } from "./pages/UsageAdmin";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/workspaces",
    element: <ProtectedRoute><WorkspaceList /></ProtectedRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: "/workspace/:id/define",
    element: <ProtectedRoute><WorkspaceDefine /></ProtectedRoute>,
  },
  {
    path: "/workspace/:id/shape",
    element: <ProtectedRoute><WorkspaceShape /></ProtectedRoute>,
  },
  {
    path: "/workspace/:id/box",
    element: <ProtectedRoute><WorkspaceBox /></ProtectedRoute>,
  },
  {
    path: "/admin/usage",
    element: <ProtectedRoute><UsageAdmin /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
