import { createRoot } from "react-dom/client";
import "./styles/globals.css"
import "./styles/kfs.css"

import App from "./App.tsx";

createRoot(document.getElementById("pixi-container")!).render(<App />);
