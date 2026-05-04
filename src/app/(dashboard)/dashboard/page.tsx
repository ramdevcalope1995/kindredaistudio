import { Suspense } from "react";
import { DashboardApp } from "@/components/dashboard/DashboardApp";

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardApp />
    </Suspense>
  );
}
