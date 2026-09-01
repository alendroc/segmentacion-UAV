import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { CargaPage } from "@/features/carga/CargaPage";
import { ExportacionPage } from "@/features/exportacion/ExportacionPage";
import { ProcesamientoPage } from "@/features/procesamiento/ProcesamientoPage";
import { ProyectosPage } from "@/features/proyectos/ProyectosPage";
import { VisorPage } from "@/features/visor/VisorPage";

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
