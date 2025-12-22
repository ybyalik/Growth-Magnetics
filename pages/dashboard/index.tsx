import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth-context";
import DashboardLayout from "../../components/DashboardLayout";
import styles from "../../styles/Dashboard.module.css";

export default function DashboardIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (!loading && user) {
      router.replace("/dashboard/websites");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard - Biznoz">
        <div className={styles.loading}>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard - Biznoz">
      <div className={styles.loading}>Redirecting...</div>
    </DashboardLayout>
  );
}
