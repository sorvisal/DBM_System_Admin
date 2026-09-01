import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/types";
import { getStoredUser } from "@/lib/api/client";

export const metadata = {
  title: "Platform | DBM",
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (!user || !isSuperAdmin(user.role)) {
    redirect("/admin");
  }
  return <>{children}</>;
}
