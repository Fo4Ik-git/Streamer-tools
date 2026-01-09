import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Integrations } from "./pages/Integrations";
import { ModuleCustomUI } from "./pages/ModuleCustomUI";
import { Modules } from "./pages/Modules";
import { ModuleSettings } from "./pages/ModuleSettings";

function App() {
  return (
    <main className="w-full h-full">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="modules" element={<Modules />} />
            <Route path="modules/:moduleId/settings" element={<ModuleSettings />} />
            <Route path="modules/:moduleId/custom-ui" element={<ModuleCustomUI />} />
            <Route path="integrations" element={<Integrations />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </main>
  );
}

export default App;
