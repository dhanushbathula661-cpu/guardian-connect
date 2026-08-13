import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Bell,
  Broadcast,
  FirstAidKit,
  List,
  MapPin,
  NavigationArrow,
  Phone,
  ShieldCheck,
  Siren,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhoenixLogo, PhoenixMark } from "@/components/brand/PhoenixLogo";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAuth } from "@/lib/phoenix/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PHOENIX — When every second matters" },
      {
        name: "description",
        content:
          "PHOENIX is a smart public safety platform: one-tap emergency SOS, live location sharing, incident reporting and nearby emergency services.",
      },
      { property: "og:title", content: "PHOENIX — When every second matters" },
      {
        property: "og:description",
        content:
          "One-tap emergency SOS, live location sharing, incident reporting and nearby emergency services.",
      },
    ],
  }),
  component: Landing,
});

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Emergency Services", href: "#services" },
  { label: "Safety", href: "#safety" },
];

const FEATURES = [
  {
    icon: Siren,
    title: "Emergency SOS",
    body: "One-tap emergency assistance with a deliberate confirmation step so it never fires by accident.",
  },
  {
    icon: MapPin,
    title: "Live Location",
    body: "Capture and share precise GPS coordinates the moment an emergency starts.",
  },
  {
    icon: WarningCircle,
    title: "Incident Reporting",
    body: "Report accidents, crimes, hazards and emergencies with photo or video evidence.",
  },
  {
    icon: UsersThree,
    title: "Emergency Contacts",
    body: "Keep trusted people ready — prioritised and notified automatically.",
  },
  {
    icon: FirstAidKit,
    title: "Nearby Services",
    body: "Find police stations, hospitals and fire stations around your live position.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    body: "Real-time status updates as responders acknowledge and resolve your case.",
  },
];

const STEPS = [
  { n: "01", title: "Create Account", body: "Register in seconds with secure, validated credentials." },
  { n: "02", title: "Set Emergency Contacts", body: "Add the people who should hear from you first." },
  { n: "03", title: "Activate SOS / Report", body: "Trigger an SOS or file a detailed incident report." },
  { n: "04", title: "Receive Assistance", body: "Track responder status from acknowledged to resolved." },
];

const FLOW = ["USER", "SOS", "LOCATION", "CONTACTS", "RESPONSE"];

function Landing() {
  const { isAuthenticated } = useAuth();
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.from("[data-hero-line]", {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        stagger: 0.09,
        ease: "power3.out",
      });
      gsap.from("[data-hero-sub]", {
        y: 18,
        opacity: 0,
        duration: 0.7,
        delay: 0.35,
        ease: "power2.out",
      });
      gsap.from("[data-flow-node]", {
        opacity: 0,
        y: 26,
        scale: 0.94,
        duration: 0.5,
        stagger: 0.14,
        delay: 0.4,
        ease: "back.out(1.6)",
      });
      gsap.to("[data-flow-pulse]", {
        opacity: 0.15,
        scale: 1.12,
        repeat: -1,
        yoyo: true,
        duration: 1.6,
        ease: "sine.inOut",
        stagger: 0.2,
      });
    }, heroRef);

    const stepsContext = gsap.context(() => {
      gsap.from("[data-step]", {
        scrollTrigger: { trigger: stepsRef.current, start: "top 78%" },
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.12,
        ease: "power2.out",
      });
    }, stepsRef);

    return () => {
      context.revert();
      stepsContext.revert();
    };
  }, [reduced]);

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-border bg-background/85 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" aria-label="PHOENIX home">
            <PhoenixLogo />
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth" search={{ mode: "register" }}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <List size={22} />}
          </Button>
        </div>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-background/95 px-4 pb-5 lg:hidden"
          >
            <nav className="flex flex-col gap-1 pt-3" aria-label="Mobile">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/auth" search={{ mode: "register" }}>
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.div>
        ) : null}
      </header>

      <main>
        <section id="home" ref={heroRef} className="hero-aura relative overflow-hidden pt-32 pb-20 sm:pt-40">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Broadcast size={14} weight="fill" className="text-emergency" />
                Live emergency response platform
              </span>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
                <span className="block overflow-hidden">
                  <span data-hero-line className="block">
                    When every
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span data-hero-line className="block text-gradient-primary">
                    second matters.
                  </span>
                </span>
              </h1>
              <p data-hero-sub className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                PHOENIX connects people to emergency assistance through intelligent alerts, location
                sharing, incident reporting and real-time safety tools.
              </p>
              <div data-hero-sub className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-7 text-base">
                  <Link to="/auth" search={{ mode: "register" }}>
                    Get Started <ArrowRight size={18} className="ml-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
                  <a href="#features">Explore Safety Features</a>
                </Button>
              </div>
              <dl data-hero-sub className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {[
                  ["< 3s", "to raise an SOS"],
                  ["24/7", "incident intake"],
                  ["GPS", "accurate location"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-bold text-foreground">{value}</dt>
                    <dd className="text-xs text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="surface-panel relative mx-auto max-w-md p-7">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Response flow
                  </span>
                  <PhoenixMark className="h-6 w-6 text-primary" />
                </div>
                <ul className="mt-6 space-y-3">
                  {FLOW.map((node, index) => (
                    <li key={node} data-flow-node className="relative">
                      <div className="flex items-center gap-4 rounded-xl border border-border bg-background/60 p-4">
                        <span
                          data-flow-pulse
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                            index === 1
                              ? "bg-emergency/15 text-emergency"
                              : "bg-primary/12 text-primary"
                          }`}
                        >
                          {index === 0 ? <ShieldCheck size={20} weight="duotone" /> : null}
                          {index === 1 ? <Siren size={20} weight="duotone" /> : null}
                          {index === 2 ? <MapPin size={20} weight="duotone" /> : null}
                          {index === 3 ? <UsersThree size={20} weight="duotone" /> : null}
                          {index === 4 ? <NavigationArrow size={20} weight="duotone" /> : null}
                        </span>
                        <div>
                          <p className="font-display text-sm font-semibold tracking-wide">{node}</p>
                          <p className="text-xs text-muted-foreground">
                            {
                              [
                                "Verified account with trusted contacts",
                                "One tap, one confirmation",
                                "GPS captured with accuracy radius",
                                "Contacts notified instantly",
                                "Responders acknowledge and resolve",
                              ][index]
                            }
                          </p>
                        </div>
                      </div>
                      {index < FLOW.length - 1 ? (
                        <span className="ml-9 block h-3 w-px bg-border" aria-hidden />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Built for real emergencies</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Every feature is connected to a live backend — alerts, locations and reports persist and
              reach the safety command center.
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full gap-3 p-6">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
                      <feature.icon size={22} weight="duotone" />
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" ref={stepsRef} className="border-t border-border py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div key={step.n} data-step className="rounded-xl border border-border bg-surface/50 p-6">
                  <span className="font-display text-4xl font-bold text-primary/35">{step.n}</span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="border-t border-border py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Emergency services, one tap away</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              PHOENIX surfaces the closest police stations, hospitals, fire stations and ambulance
              services around your live location using OpenStreetMap data.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, label: "Police" },
                { icon: FirstAidKit, label: "Hospitals" },
                { icon: Siren, label: "Fire Stations" },
                { icon: Phone, label: "Ambulance" },
              ].map((service) => (
                <Card key={service.label} className="items-center gap-2 p-8 text-center">
                  <service.icon size={30} weight="duotone" className="text-primary" />
                  <p className="mt-2 font-semibold">{service.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="safety" className="border-t border-border py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Safety you can trust with your data
            </h2>
            <p className="mt-4 text-muted-foreground">
              Hashed credentials, role-based access, row-level database security and private evidence
              storage. Your location is never faked, never shared without an active emergency.
            </p>
            <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
              <Link to="/auth" search={{ mode: "register" }}>
                Create your PHOENIX account
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <PhoenixLogo subtitle />
          <p className="text-xs text-muted-foreground">
            PHOENIX is a safety companion — always call your local emergency number in a life
            threatening situation.
          </p>
        </div>
      </footer>
    </div>
  );
}
