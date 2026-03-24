import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { WorkspaceDefine } from "./pages/WorkspaceDefine";
import { WorkspaceShape } from "./pages/WorkspaceShape";
import { WorkspaceBox } from "./pages/WorkspaceBox";

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
    Component: Dashboard,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/workspace/:id/define",
    Component: WorkspaceDefine,
  },
  {
    path: "/workspace/:id/shape",
    Component: WorkspaceShape,
  },
  {
    path: "/workspace/:id/box",
    Component: WorkspaceBox,
  },
]);
