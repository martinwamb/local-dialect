"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/languages", label: "Learn", icon: "📚" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-inset-bottom">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = path === item.href || path.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors ${
                active ? "text-emerald-600" : "text-gray-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={active ? "font-semibold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
