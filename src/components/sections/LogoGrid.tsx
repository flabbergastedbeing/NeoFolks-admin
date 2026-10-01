import {
  SiReact,
  SiTypescript,
  SiVite,
  SiTailwindcss,
  SiPython,
  SiTensorflow,
  SiNodedotjs,
  SiDocker,
  SiGithub,
  SiFigma,
  SiFirebase,
  SiMongodb,
  SiGooglecloud,
  SiGraphql,
  SiVercel,
  SiPytorch,
  SiPostgresql,
  SiNextdotjs,
  SiKubernetes,
  SiSupabase,
} from "react-icons/si";
import { SectionHeader } from "@/components/common/SectionHeader";

const ecosystemLogos = [
  { Icon: SiReact, label: "React", role: "UI Library", color: "#61DAFB" },
  { Icon: SiNextdotjs, label: "Next.js", role: "Fullstack Framework", color: "#ffffff" },
  { Icon: SiTypescript, label: "TypeScript", role: "Type Safety", color: "#3178C6" },
  { Icon: SiPython, label: "Python", role: "AI & Scripting", color: "#3776AB" },
  { Icon: SiPytorch, label: "PyTorch", role: "Deep Learning", color: "#EE4C2C" },
  { Icon: SiTensorflow, label: "TensorFlow", role: "Machine Learning", color: "#FF6F00" },
  { Icon: SiNodedotjs, label: "Node.js", role: "Backend Runtime", color: "#5FA04E" },
  { Icon: SiDocker, label: "Docker", role: "Containers", color: "#2496ED" },
  { Icon: SiKubernetes, label: "Kubernetes", role: "Orchestration", color: "#326CE5" },
  { Icon: SiSupabase, label: "Supabase", role: "Database & Auth", color: "#3ECF8E" },
  { Icon: SiPostgresql, label: "PostgreSQL", role: "Relational DB", color: "#4169E1" },
  { Icon: SiTailwindcss, label: "Tailwind CSS", role: "Utility Styling", color: "#38BDF8" },
  { Icon: SiFigma, label: "Figma", role: "Interface Design", color: "#F24E1E" },
  { Icon: SiGithub, label: "GitHub", role: "Version Control", color: "#ffffff" },
  { Icon: SiGooglecloud, label: "Google Cloud", role: "Cloud Infra", color: "#4285F4" },
  { Icon: SiVercel, label: "Vercel", role: "Edge Deployments", color: "#ffffff" },
];

export function LogoGrid() {
  // Duplicate for seamless infinite loop
  const duplicatedLogos = [...ecosystemLogos, ...ecosystemLogos];

  return (
    <section className="section-spacing relative overflow-hidden py-40">
      <div className="container-page flex flex-col gap-32">
        <div className="text-center">
          <p className="font-mono text-caption font-medium uppercase tracking-widest text-lavender-pulse">
            Ecosystem & Tools
          </p>
          <h2 className="font-alpha-lyrae mt-8 text-[28px] font-normal tracking-tight text-ghost-white sm:text-heading">
            Built With Modern Industry Standards
          </h2>
          <p className="mx-auto mt-8 max-w-[560px] text-body-sm text-ash-gray">
            Our members build, deploy, and collaborate using the exact tools used at high-growth startups and top engineering teams.
          </p>
        </div>

        {/* Infinite Smooth Flow Marquee Track */}
        <div className="group relative mt-16 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-16 py-12 group-hover:[animation-play-state:paused]">
            {duplicatedLogos.map(({ Icon, label, role, color }, idx) => (
              <div
                key={`${label}-${idx}`}
                className="flex items-center gap-12 rounded-card border border-graphite/50 bg-carbon-card/80 px-20 py-12 backdrop-blur-sm transition-all duration-200 hover:border-ghost-white/40 hover:bg-carbon-card hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              >
                <Icon className="h-[18px] w-[18px] shrink-0" style={{ color }} aria-label={label} />
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-semibold text-ghost-white whitespace-nowrap">{label}</span>
                  <span className="text-[11px] text-steel-gray whitespace-nowrap">{role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}