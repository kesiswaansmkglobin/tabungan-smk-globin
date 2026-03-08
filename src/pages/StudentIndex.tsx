import React from "react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import StudentAuth from "@/components/StudentAuth";
import StudentDashboard from "@/components/StudentDashboard";
import { Loader2 } from "lucide-react";

const StudentIndex = () => {
  const { student, loading } = useStudentAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Memuat...</p>
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
