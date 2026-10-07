import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "@/widgets/layout";
import { CargaPage } from "@/pages/carga";
import { ExportacionPage } from "@/pages/exportacion";
import { ProcesamientoPage } from "@/pages/procesamiento";
import { ProyectosPage } from "@/pages/proyectos";
import { VisorPage } from "@/pages/visor";

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/proyectos" replace />} />
        <Route path="proyectos" element={<ProyectosPage />} />
        <Route path="proyectos/:proyectoId">
          <Route index element={<Navigate to="visor" replace />} />
          <Route path="carga" element={<CargaPage />} />
          <Route path="procesamiento" element={<ProcesamientoPage />} />
          <Route path="visor" element={<VisorPage />} />
          <Route path="exportacion" element={<ExportacionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/proyectos" replace />} />
      </Route>
    </Routes>
  );
}
