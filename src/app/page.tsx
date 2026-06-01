import Link from "next/link";

const LANGUAGES = [
  { name: "Kikuyu", native: "Gĩkũyũ", emoji: "🇰🇪", active: true, learners: "2.4k" },
  { name: "Luo", native: "Dholuo", emoji: "🇰🇪", active: false, learners: "Coming soon" },
  { name: "Luhya", native: "Luluhya", emoji: "🇰🇪", active: false, learners: "Coming soon" },
  { name: "Kamba", native: "Kikamba", emoji: "🇰🇪", active: false, learners: "Coming soon" },
];

const FEATURES = [
  { icon: "🎯", title: "Daily lessons", desc: "5–10 minute lessons designed to fit into your day." },
  { icon: "🔊", title: "Hear it spoken", desc: "Native-quality audio pronunciation for every word." },
  { icon: "🏆", title: "Earn rewards", desc: "XP points, streaks, and badges keep you motivated." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="font-bold text-xl text-emerald-600">Local Dialect</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Log in
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-6xl mb-4">🗣️</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 max-w-2xl leading-tight">
          Speak your roots.<br />
          <span className="text-emerald-600">Learn Kenyan dialects.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl">
          Master Kikuyu, Luo, Luhya and more through short daily lessons — with real audio, fun exercises, and rewards to keep you going.
        </p>
        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          <Link href="/register" className="px-8 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors text-lg">
            Start learning free
          </Link>
          <Link href="/login" className="px-8 py-3 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-colors text-lg">
            I have an account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center gap-3">
              <div className="text-4xl">{f.icon}</div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Languages */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Available languages</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LANGUAGES.map((lang) => (
              <div key={lang.name} className={`rounded-2xl border p-6 flex flex-col gap-2 ${lang.active ? "bg-white border-emerald-200 shadow-sm" : "bg-white border-gray-200 opacity-60"}`}>
                <div className="text-3xl">{lang.emoji}</div>
                <div className="font-bold text-gray-900">{lang.name}</div>
                <div className="text-sm text-gray-500">{lang.native}</div>
                <div className="text-xs text-emerald-600 font-medium mt-auto">{lang.learners}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start?</h2>
        <p className="text-gray-600 mb-8">Free to use. No credit card required.</p>
        <Link href="/register" className="px-10 py-4 bg-emerald-600 text-white rounded-full font-semibold text-lg hover:bg-emerald-700 transition-colors">
          Begin your first lesson
        </Link>
      </section>

      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-100">
        © {new Date().getFullYear()} Local Dialect · Made with ❤️ for Kenya
      </footer>
    </div>
  );
}
