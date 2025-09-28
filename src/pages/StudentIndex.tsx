import React from "react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import StudentAuth from "@/components/StudentAuth";
import StudentDashboard from "@/components/StudentDashboard";

const StudentIndex = () => {
  const { student, loading } = useStudentAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return <StudentAuth />;
  }

  return <StudentDashboard />;
};

export default StudentIndex;