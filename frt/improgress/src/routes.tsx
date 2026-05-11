import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DepartmentManagement } from "./pages/DepartmentManagement";
import { MetricTypeManagement } from "./pages/MetricTypeManagement";
import { MetricTypeCategoryManagement } from "./pages/MetricTypeCategoryManagement";
import { ImportMunicipalityData } from "./pages/ImportMunicipalityData";
import { GeographicMap } from "./pages/GeographicMap";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DepartmentManagement },
      { path: "departments", Component: DepartmentManagement },
      { path: "metric-types", Component: MetricTypeManagement },
      { path: "metric-type-categories", Component: MetricTypeCategoryManagement },
      { path: "import-data", Component: ImportMunicipalityData },
      { path: "map", Component: GeographicMap },
    ],
  },
]);
