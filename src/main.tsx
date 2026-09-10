import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/global.css";
import { installChunkRecovery } from "./lib/chunk-recovery";

installChunkRecovery();
createRoot(document.getElementById("root")!).render(<App />);
