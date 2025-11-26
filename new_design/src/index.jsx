import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DashboardQualit } from "./screens/DashboardQualit";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <DashboardQualit />
  </StrictMode>,
);
