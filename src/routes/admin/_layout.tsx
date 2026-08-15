import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StaffGuard } from "@/components/StaffGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/_layout")({
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  return (
    <StaffGuard>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </StaffGuard>
  );
}
