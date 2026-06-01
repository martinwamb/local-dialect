import Link from "next/link";
import { signOut } from "@/auth";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function TopNav({ user }: Props) {
  return (
    <header className="hidden sm:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
      <Link href="/dashboard" className="font-bold text-lg text-emerald-600">
        Local Dialect
      </Link>
      <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
        <Link href="/languages" className="hover:text-gray-900 transition-colors">Languages</Link>
        <Link href="/profile" className="hover:text-gray-900 transition-colors">Profile</Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="text-gray-500 hover:text-gray-900 transition-colors">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
