import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import TopNav from "@/components/layout/TopNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav user={session.user} />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
