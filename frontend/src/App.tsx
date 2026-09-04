import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import StudentAssignments from "./pages/student/Assignments";
import StudentLibrary from "./pages/student/Library";
import StudentProgress from "./pages/student/Progress";
import TeacherOverview from "./pages/teacher/Overview";
import TeacherAssign from "./pages/teacher/Assign";
import TeacherCatalog from "./pages/teacher/Catalog";

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {user.role === "STUDENT" ? (
          <>
            <Route index element={<StudentAssignments />} />
            <Route path="library" element={<StudentLibrary />} />
            <Route path="progress" element={<StudentProgress />} />
          </>
        ) : (
          <>
            <Route index element={<TeacherOverview />} />
            <Route path="assign" element={<TeacherAssign />} />
            <Route path="catalog" element={<TeacherCatalog />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
