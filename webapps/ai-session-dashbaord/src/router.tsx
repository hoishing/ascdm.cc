import { createHashRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { SessionsPage } from "./pages/SessionsPage";
import { PlansPage } from "./pages/PlansPage";
import { SearchPage } from "./pages/SearchPage";

export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Navigate to="/sessions" replace /> },
      { path: "/sessions", element: <SessionsPage /> },
      { path: "/plans", element: <PlansPage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/cleanup", element: <Navigate to="/sessions" replace /> },
      { path: "*", element: <Navigate to="/sessions" replace /> },
    ],
  },
]);
