import React, { useEffect, useState } from 'react';
import { Map, Gift, Trophy, Bus, Layers, TreeDeciduous, Leaf, Play } from 'lucide-react';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const IMG = (n: string) => `${BASE_URL}onboarding/${n}`;
const BG_RIGHT = IMG('backgroud_right_side.png');

interface Feature {
  num: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tags: string[];
  img: string;
}

// CHINOR 100 concept cards. Each `img` is loaded from public/onboarding/… — if a
// file is missing, the image simply fades and the branded gradient + icon show.
const FEATURES: Feature[] = [
  { num: '01', Icon: Map, title: 'Karta CHINOR 100', desc: 'Butun shahar — bitta interfeysda: qiziqish, kayfiyat, vaqt va marshrut bo‘yicha.', tags: ['Kayfiyat', 'Qiziqish', 'Vaqt', 'Marshrut'], img: IMG('card1.png') },
  { num: '04', Icon: Gift, title: 'Shahar sodiqligi', desc: 'Shaharni ko‘proq kashf etsang — u ko‘proq qaytaradi: ballar, bonuslar, mukofotlar.', tags: ['Tashrif → ball', 'Marshrut → mukofot'], img: IMG('card2.png') },
  { num: '06', Icon: Bus, title: 'CHINOR BUS', desc: 'Kalit lokatsiyalar orasidagi maxsus reys: muzika, tavsiyalar, tungi iqtisod.', tags: ['Kino ko‘chasi', 'Musiqa ko‘chasi', 'Texnologiya'], img: IMG('card3.png') },
  { num: '08', Icon: Trophy, title: 'Shahar reytingi', desc: 'Oyning ko‘chasi, eng zo‘r taom, eng yaxshi tadbir va sevimli oshpaz.', tags: ['Reyting', 'Ovoz berish', 'Tanlov'], img: IMG('card4.png') },
  { num: '★', Icon: Layers, title: 'Fizik · Raqamli · Media shahar', desc: 'Ko‘chalar, karta, pasport va gid — bitta yagona ekotizimda.', tags: ['Fizik', 'Raqamli', 'Media'], img: IMG('card5.png') },
];

interface Props {
  progress: number;
  ready: boolean;
  onStart: () => void;
}

/**
 * Branded CHINOR 100 onboarding shown while the 3D city streams in. Split screen:
 * the left half holds the content (logo, an auto-rotating image-card carousel and
 * the progress → "enter" control); the right half is a full-bleed hero image
 * (public/onboarding/backgroud_right_side.png). On narrow screens the right half
 * is hidden and the content fills the width.
 */
export const OnboardingSplash: React.FC<Props> = ({ progress, ready, onStart }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % FEATURES.length), 4200);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, Math.round(progress));

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden text-[#f4f1ea]">
      <style>{`
        @keyframes chinorFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes chinorRise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chinorShimmer { to{background-position:200% center} }
        @keyframes chinorPulse { 0%,100%{box-shadow:0 0 0 0 rgba(216,180,90,.45)} 50%{box-shadow:0 0 0 16px rgba(216,180,90,0)} }
        @keyframes chinorDrift { 0%{transform:translateY(10px) rotate(-8deg);opacity:0} 15%{opacity:.5} 100%{transform:translateY(-70px) rotate(14deg);opacity:0} }
      `}</style>

      {/* LEFT HALF — content */}
      <div
        className="relative w-full md:w-1/2 h-full overflow-hidden flex flex-col"
        style={{
          background:
            'radial-gradient(900px 500px at 30% -10%, rgba(216,180,90,0.12), transparent 60%),' +
            'linear-gradient(160deg, #0b2e22 0%, #0f3d2e 46%, #07201a 100%)',
        }}
      >
        {[0, 1, 2].map((n) => (
          <Leaf
            key={n}
            className="absolute text-[#d8b45a]"
            style={{
              left: `${12 + n * 30}%`,
              top: `${18 + (n % 2) * 46}%`,
              width: 26 + n * 6,
              height: 26 + n * 6,
              opacity: 0.06,
              animation: `chinorDrift ${9 + n * 2}s ease-in ${n * 1.4}s infinite`,
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col h-full py-6 px-6 sm:px-10">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-5" style={{ animation: 'chinorRise .7s ease-out both' }}>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0"
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

          {/* Vertical image-card carousel — fills the available height */}
          <div className="relative flex-1 min-h-0">
            {FEATURES.map((f, idx) => {
              const on = idx === active;
              return (
                <div
                  key={f.title}
                  className="absolute inset-0 transition-all duration-700 ease-out"
                  style={{
                    opacity: on ? 1 : 0,
                    transform: on ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.98)',
                    pointerEvents: on ? 'auto' : 'none',
                  }}
                  aria-hidden={!on}
                >
                  <div
                    className="w-full h-full rounded-3xl overflow-hidden border flex flex-col"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(216,180,90,0.22)',
                      boxShadow: '0 24px 70px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Image (top ~55%) with branded fallback behind */}
                    <div
                      className="relative w-full h-[55%] shrink-0"
                      style={{ background: 'linear-gradient(135deg,#14503b,#0b2e22)' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.22 }}>
                        <f.Icon className="w-28 h-28 text-[#e6c877]" />
                      </div>
                      <img
                        src={f.img}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = '0';
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(180deg, transparent 68%, rgba(7,32,26,0.7))' }}
                      />
                      <span
                        className="absolute top-3 left-3 px-3 py-1.5 rounded-xl text-sm font-black"
                        style={{ background: 'rgba(7,32,26,0.82)', color: '#e6c877' }}
                      >
                        {f.num}
                      </span>
                    </div>

                    {/* Copy */}
                    <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center text-left">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(216,180,90,0.14)' }}
                        >
                          <f.Icon className="w-6 h-6 text-[#e6c877]" />
                        </span>
                        <span className="text-xs tracking-[0.26em] text-[#8fb3a2]">CHINOR 100</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">{f.title}</h2>
                      <p className="text-sm sm:text-base text-[#cfe0d7] mb-4 leading-relaxed">{f.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {f.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs px-3 py-1.5 rounded-full border"
                            style={{ background: 'rgba(20,80,59,0.5)', borderColor: 'rgba(216,180,90,0.28)', color: '#e8d4a0' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* dots + counter */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              {FEATURES.map((f, idx) => (
                <button
                  key={f.title}
                  onClick={() => setActive(idx)}
                  aria-label={`Slayd ${idx + 1}`}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: idx === active ? 24 : 7, background: idx === active ? '#e6c877' : 'rgba(255,255,255,0.25)' }}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#8fb3a2] tabular-nums">
              {String(active + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
            </span>
          </div>

          {/* Progress -> Start */}
          <div className="mt-4" style={{ animation: 'chinorRise 1s ease-out both' }}>
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
                <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
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

      {/* RIGHT HALF — full-bleed hero image (hidden on narrow screens) */}
      <div
        className="hidden md:block md:w-1/2 h-full relative"
        style={{
          backgroundColor: '#0b2e22',
          backgroundImage: `url(${BG_RIGHT})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* soft blend so the split line isn't harsh */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(7,32,26,0.55), transparent 22%)' }}
        />
      </div>
    </div>
  );
};
