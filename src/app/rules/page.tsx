import {
  Trophy,
  Users,
  Zap,
  Target,
  ChevronRight,
  Info,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest">
          <Info size={14} />
          Guide & Regler
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-none uppercase">
          Så fungerar <span className="text-primary">Tippwits</span>
        </h1>
        <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">
          Allt du behöver veta om poängsystemet, ligor och annat.
        </p>
      </div>

      {/* Point System - Inverse Popularity */}
      <section className="bg-card rounded-[2.5rem] border border-border p-8 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Zap size={24} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Poängsystemet
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                Inverse Popularity
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Vi använder ett unikt system som belönar de som vågar gå mot
                strömmen. Ju färre som tippat som du, desto mer poäng får du vid
                rätt resultat.
              </p>
              <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
                <p className="text-sm font-black uppercase tracking-widest text-primary mb-2">
                  Formeln
                </p>
                <code className="text-foreground font-mono text-sm">
                  100 - (% av spelare med samma tips)
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Exempel</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                  <span className="text-sm">
                    90% har tippat <span className="font-bold">Brasilien</span>
                  </span>
                  <span className="font-black text-destructive">10 poäng</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                  <span className="text-sm">
                    10% har tippat <span className="font-bold">Kryss</span>
                  </span>
                  <span className="font-black text-green-500">90 poäng</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                * Minsta poäng för rätt tips är alltid 10p.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multipliers */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Layers className="text-primary" size={24} />
            Multiplikatorer
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Poängen skalas upp ju längre in i turneringen vi kommer för att
            behålla spänningen hela vägen.
          </p>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { stage: 'Gruppspel', mult: 'x1' },
            { stage: '16/8-del', mult: 'x1.5' },
            { stage: 'Kvartsfinal', mult: 'x2.0' },
            { stage: 'Semifinal', mult: 'x2.5' },
            { stage: 'Final / Brons', mult: 'x3.0' },
          ].map((item) => (
            <div
              key={item.stage}
              className="bg-card border border-border p-4 rounded-[1.5rem] text-center space-y-1"
            >
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {item.stage}
              </p>
              <p className="text-2xl font-black text-primary">{item.mult}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deadlines & Checklist */}
      <section className="bg-card rounded-[2.5rem] border border-border p-8 md:p-12 relative overflow-hidden shadow-lg mt-16">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-foreground shadow-sm">
              <Target size={24} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Deadlines & Checklista
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                1. Innan VM börjar
              </h3>

              <ul className="ml-4 mt-2 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">Gruppspel:</strong> Tippa
                  placeringen (1:a till 4:e) för ALLA lag i gruppspelet.{' '}
                  <span className="text-destructive font-bold">
                    Dessa låses när turneringens första match börjar.
                  </span>
                </li>
                <li>
                  <strong className="text-foreground">Top 3:</strong> Tippa
                  medaljerna (1-3), detta behöver sparas innan första matchen i
                  VM.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                2. Löpande under turneringen
              </h3>
              <p className="text-sm text-muted-foreground ml-4 leading-relaxed">
                Du behöver inte tippa alla matcher i förväg. För varje enskild
                match gäller:
              </p>
              <ul className="ml-4 mt-2 space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>
                  <strong className="text-foreground">
                    Matchtips (1X2 & Avancemang):
                  </strong>{' '}
                  Du kan tippa och ändra dina tips fram tills{' '}
                  <span className="text-primary font-bold">
                    1 timme innan avspark
                  </span>{' '}
                  för den specifika matchen. Därefter är matchen låst!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Two Phases */}
      <div className="grid gap-10 md:grid-cols-2 mt-16">
        {/* Phase 1 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-black">
              1
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Gruppspelet
            </h2>
          </div>
          <ul className="space-y-4">
            {[
              {
                title: '1X2 Tips',
                desc: 'Tippa vinnare eller oavgjort för varje match.',
              },
              {
                title: 'Grupplacering',
                desc: 'Tippa 1:a till 4:e plats i varje grupp. Varje lag du sätter på exakt rätt position ger dig hela 100 poäng. En helt korrekt grupp ger alltså upp till 400 poäng!',
              },
              {
                title: 'Topp 3',
                desc: 'Tippa hela mästerskapets Topp 3 innan turneringen drar igång. 500/750/1000p respektive.',
              },
              {
                title: 'Deadline',
                desc: 'Tipsen låses 1 timme innan respektive match sparkar igång.',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <Target className="text-primary shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="font-bold text-foreground leading-none">
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Phase 2 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-black">
              2
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Slutspelet
            </h2>
          </div>
          <ul className="space-y-4">
            {[
              {
                title: 'Dubbla Tips',
                desc: 'För varje match tippar du både 1X2 (efter full tid) OCH vilket lag som går vidare.',
              },
              {
                title: 'Större Risk',
                desc: 'Inverse Popularity gäller för båda tipsen oberoende av varandra.',
              },
              {
                title: 'Fristående rundor',
                desc: 'Du väljer fritt vilka lag du tror går vidare, oavsett vad du tippade i förra rundan.',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <ArrowUpRight className="text-primary shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="font-bold text-foreground leading-none">
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Social & Leagues */}
      <section className="bg-secondary/30 rounded-[2.5rem] p-8 md:p-12 border border-border/50 text-center space-y-6">
        <Users className="mx-auto text-primary" size={48} />
        <h2 className="text-3xl font-black uppercase tracking-tight">
          Tävla tillsammans
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Skapa en egen liga och bjud in vänner, kollegor eller familjen. Ni får
          en egen chat och en lokal tabell där ni kan göra upp om vem som har
          bäst koll på fotboll.
        </p>
        <div className="pt-4">
          <Link
            href="/leagues"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Mina Ligor <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer / CTA */}
      <div className="text-center pb-12">
        <p className="text-muted-foreground text-sm">
          Lycka till! Må bästa tippare vinna.
        </p>
      </div>
    </div>
  );
}
