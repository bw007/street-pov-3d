import React, { useEffect, useState } from 'react';
import { Map, Gift, Trophy, Bus, Sparkles, Layers, TreeDeciduous, Leaf, Play } from 'lucide-react';

interface Feature {
  num: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tags: string[];
}

// Feature highlights drawn from the CHINOR 100 concept deck.
const FEATURES: Feature[] = [
  { num: '01', Icon: Map, title: 'Karta CHINOR 100', desc: 'Butun shahar — bitta interfeysda.', tags: ['Kayfiyat', 'Qiziqish', 'Vaqt', 'Marshrut'] },
  { num: '04', Icon: Gift, title: 'Shahar sodiqligi', desc: "Shaharni ko'proq kashf etsang — u ko'proq qaytaradi.", tags: ['Tashrif → ball', 'Marshrut → mukofot'] },
  { num: '08', Icon: Trophy, title: 'Shahar reytingi', desc: "Oyning ko'chasi, eng zo'r taom, eng yaxshi tadbir.", tags: ['Reyting', 'Ovoz berish', 'Tanlov'] },
  { num: '06', Icon: Bus, title: 'CHINOR BUS', desc: 'Maxsus reys: muzika, tavsiyalar, tungi iqtisod.', tags: ["Kino ko'chasi", "Musiqa ko'chasi"] },
  { num: '10', Icon: Sparkles, title: 'Yagona brend', desc: 'Stiker · belgi · navigatsiya · karta · info-stend.', tags: ['CHINOR 100'] },
  { num: '★', Icon: Layers, title: 'Fizik · Raqamli · Media shahar', desc: "Ko'chalar, karta va gid — yagona tizimda.", tags: ['Fizik', 'Raqamli', 'Media'] },
];

interface Props {
  progress: number;
  ready: boolean;
  onStart: () => void;
}

/**
 * Branded loading / onboarding splash. While the 3D city streams in, it walks the
 * user through the CHINOR 100 concept (auto-rotating carousel) instead of showing
 * a bare progress bar; when everything is loaded it swaps the bar for a gold
 * "enter" button (a real user gesture, which is also what pointer-lock wants).
 */
export const OnboardingSplash: React.FC<Props> = ({ progress, ready, onStart }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % FEATURES.length), 3800);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, Math.round(progress));

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden text-[#f4f1ea]"
      style={{
        background:
          'radial-gradient(1100px 560px at 50% -12%, rgba(216,180,90,0.12), transparent 60%),' +
          'radial-gradient(900px 520px at 12% 116%, rgba(31,92,70,0.40), transparent 60%),' +
          'linear-gradient(160deg, #0b2e22 0%, #0f3d2e 46%, #07201a 100%)',
      }}
    >
      <style>{`
        @keyframes chinorFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes chinorRise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chinorShimmer { to{background-position:200% center} }
        @keyframes chinorPulse { 0%,100%{box-shadow:0 0 0 0 rgba(216,180,90,.45)} 50%{box-shadow:0 0 0 16px rgba(216,180,90,0)} }
        @keyframes chinorDrift { 0%{transform:translateY(10px) rotate(-8deg);opacity:0} 15%{opacity:.5} 100%{transform:translateY(-70px) rotate(14deg);opacity:0} }
      `}</style>

      {/* faint drifting chinor leaves */}
      {[0, 1, 2, 3].map((n) => (
        <Leaf
          key={n}
          className="absolute text-[#d8b45a]"
          style={{
            left: `${12 + n * 22}%`,
            top: `${18 + (n % 2) * 42}%`,
            width: 26 + n * 6,
            height: 26 + n * 6,
            opacity: 0.06,
            animation: `chinorDrift ${9 + n * 2}s ease-in ${n * 1.4}s infinite`,
          }}
        />
      ))}

      <div className="relative z-10 h-full flex flex-col items-center justify-between py-8 sm:py-10 px-6">
        {/* Brand */}
        <div className="flex items-center gap-3" style={{ animation: 'chinorRise .7s ease-out both' }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border"
            style={{
              background: 'linear-gradient(145deg,#14503b,#0d3527)',
              borderColor: 'rgba(216,180,90,.5)',
              animation: 'chinorFloat 6s ease-in-out infinite',
            }}
          >
            <TreeDeciduous className="w-6 h-6 text-[#e6c877]" />
          </div>
          <div className="text-left leading-none">
            <div
              className="text-lg font-black tracking-[0.18em]"
              style={{
                backgroundImage: 'linear-gradient(90deg,#e6c877,#fff3d4,#d8b45a,#e6c877)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                animation: 'chinorShimmer 4s linear infinite',
              }}
            >
              CHINOR 100
            </div>
            <div className="text-[10px] tracking-[0.32em] text-[#8fb3a2] mt-1">TOSHKENT · 3D</div>
          </div>
        </div>

        {/* Hero + carousel */}
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-[28px] font-extrabold leading-tight mb-1" style={{ animation: 'chinorRise .7s ease-out both' }}>
            Butun shahar — <span className="text-[#e6c877]">bitta ilovada</span>
          </h1>
          <p className="text-xs text-[#9fc0b0] mb-6" style={{ animation: 'chinorRise .9s ease-out both' }}>
            Yuklanayotgan vaqtda tizim bilan tanishib chiqing
          </p>

          <div className="relative w-full min-h-[210px]">
            {FEATURES.map((f, idx) => {
              const on = idx === active;
              return (
                <div
                  key={f.num + f.title}
                  className="absolute inset-0 transition-all duration-700 ease-out"
                  style={{
                    opacity: on ? 1 : 0,
                    transform: on ? 'translateY(0)' : 'translateY(12px)',
                    pointerEvents: on ? 'auto' : 'none',
                  }}
                  aria-hidden={!on}
                >
                  <div
                    className="rounded-3xl border p-5 text-left backdrop-blur-md"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(216,180,90,0.18)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-sm font-bold" style={{ background: '#14503b', color: '#e6c877' }}>
                        {f.num}
                      </span>
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,180,90,0.12)' }}>
                        <f.Icon className="w-5 h-5 text-[#e6c877]" />
                      </span>
                      <h2 className="text-base sm:text-lg font-bold flex-1">{f.title}</h2>
                    </div>
                    <p className="text-sm text-[#cfe0d7] mb-4 leading-relaxed">{f.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {f.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] px-2.5 py-1 rounded-full border"
                          style={{ background: 'rgba(20,80,59,0.5)', borderColor: 'rgba(216,180,90,0.25)', color: '#e8d4a0' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* carousel dots */}
          <div className="flex items-center gap-2 mt-5">
            {FEATURES.map((f, idx) => (
              <button
                key={f.num + f.title}
                onClick={() => setActive(idx)}
                aria-label={`Slayd ${idx + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: idx === active ? 22 : 7, background: idx === active ? '#e6c877' : 'rgba(255,255,255,0.25)' }}
              />
            ))}
          </div>
        </div>

        {/* Progress → Start */}
        <div className="w-full max-w-xs flex flex-col items-center" style={{ animation: 'chinorRise 1s ease-out both' }}>
          {ready ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-[#0b2e22] transition-transform hover:scale-[1.03] active:scale-95"
              style={{ background: 'linear-gradient(90deg,#e6c877,#d8b45a)', animation: 'chinorPulse 2.2s ease-in-out infinite' }}
            >
              <Play className="w-4 h-4 fill-current" />
              Shaharga kirish
            </button>
          ) : (
            <>
              <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#14503b,#e6c877)' }}
                />
              </div>
              <span className="text-[11px] tracking-wide text-[#9fc0b0]">
                Shahar yuklanmoqda… <span className="text-[#e6c877] font-semibold">{pct}%</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
