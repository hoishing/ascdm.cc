import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClaudeDirProvider } from "./contexts/ClaudeDirContext";
import { ToastProvider } from "./components/Toast";
import { router } from "./router";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ClaudeDirProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ClaudeDirProvider>
    </ThemeProvider>
  </StrictMode>,
);
