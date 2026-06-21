import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { hasLocale, getDictionary } from "@/lib/i18n";
import { resumeData } from "@/lib/resume-data";
import ResumeActions from "@/components/ResumeActions";
import { CredlyIcon } from "@/components/CredlyIcon";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    return { title: "Not Found" };
  }

  const dict = await getDictionary(locale);

  return {
    title: `${dict.resume.title} ・ Tony Duong`,
    description: dict.resume.subtitle,
  };
}

export default async function ResumePage({ params }: PageProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const data = resumeData[locale];
  const { profile } = data;

  let sectionNumber = 0;
  const num = () => String(++sectionNumber).padStart(2, "0");

  return (
    <div className="resume mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
      {/* Header / identity */}
      <header className="resume-identity mb-8 sm:mb-10 opacity-0 animate-fade-in-up">
        <h1 className="resume-name text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
          {profile.name}
        </h1>
        <p className="resume-title text-base sm:text-xl text-primary font-medium mb-4">{profile.title}</p>
        <div className="resume-contact flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span><span className="mr-1.5">📍</span>{profile.location}</span>
          <a href={`mailto:${profile.email}`} className="hover:text-foreground transition-colors">
            <span className="mr-1.5">✉️</span>{profile.email}
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            <span className="mr-1.5">🐙</span>{profile.githubLabel}
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            <span className="mr-1.5">💼</span>{profile.linkedinLabel}
          </a>
          <a
            href={profile.blog}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            <span className="mr-1.5">📝</span>{profile.blogLabel}
          </a>
        </div>
        <p
          className="resume-summary mt-5 text-base sm:text-lg leading-relaxed text-foreground/90"
          dangerouslySetInnerHTML={{ __html: profile.summary }}
        />
        <p className="resume-about-cta no-print mt-4 text-sm text-muted-foreground leading-relaxed border border-border/50 rounded-lg px-4 py-3 bg-muted/20">
          {dict.resume.aboutChatLead}
          <Link
            href={`/${locale}/about`}
            className="text-primary font-medium hover:underline underline-offset-2"
          >
            {dict.resume.aboutChatLink}
          </Link>
          {dict.resume.aboutChatTail}
        </p>
      </header>

      {/* Actions (hidden when printing) */}
      <div className="mb-8 sm:mb-10 opacity-0 animate-fade-in-up animation-delay-100">
        <ResumeActions
          locale={locale}
          downloadLabel={dict.resume.download}
          pdfHref={`/resume/tony-duong-resume-${locale}.pdf`}
          pdfFileName={`Tony-Duong-Resume-${locale.toUpperCase()}.pdf`}
          printLabel={dict.resume.print}
          emailLabel={dict.resume.email}
          email={profile.email}
        />
      </div>

      <Separator className="my-8 sm:my-10" />

      {/* Experience */}
      <section className="mb-10 sm:mb-14 opacity-0 animate-fade-in-up animation-delay-100">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">{num()}.</span>
          {dict.resume.experience}
        </h2>
        <div className="space-y-8">
          {data.experience.map((job) => (
            <article key={`${job.company}-${job.period}`} className="resume-item">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                <h3 className="text-lg font-semibold">
                  {job.role} <span className="text-primary">・ {job.company}</span>
                </h3>
                <span className="text-sm text-muted-foreground whitespace-nowrap">{job.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{job.location}</p>
              <p className="text-sm italic text-foreground/80 mb-3">{job.context}</p>
              <ul className="space-y-1.5">
                {job.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm sm:text-base leading-relaxed">
                    <span className="text-primary shrink-0">▸</span>
                    <span dangerouslySetInnerHTML={{ __html: h }} />
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Separator className="my-8 sm:my-10" />

      {/* Projects */}
      <section className="mb-10 sm:mb-14 opacity-0 animate-fade-in-up animation-delay-100">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">{num()}.</span>
          {dict.resume.projects}
        </h2>
        <div className="space-y-5">
          {data.projects.map((project) => (
            <article key={project.name} className="resume-item">
              <h3 className="text-base font-semibold">
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {project.name}
                  </a>
                ) : (
                  project.name
                )}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90 mt-1">
                {project.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Separator className="my-8 sm:my-10" />

      {/* Skills */}
      <section className="mb-10 sm:mb-14 opacity-0 animate-fade-in-up animation-delay-100">
        <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="text-primary">{num()}.</span>
          {dict.resume.skills}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {data.skills.map((group) => (
            <div key={group.label} className="resume-item">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1.5">{group.label}</h3>
              <p className="text-sm sm:text-base leading-relaxed">{group.items.join(" ・ ")}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-8 sm:my-10" />

      {/* Education + Certifications + Languages */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 opacity-0 animate-fade-in-up animation-delay-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-primary">{num()}.</span>
            {dict.resume.education}
          </h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.school} className="resume-item">
                <h3 className="text-base font-semibold">{edu.school}</h3>
                <p className="text-sm text-foreground/90">{edu.degree}</p>
                <p className="text-sm text-muted-foreground">
                  {edu.period} ・ {edu.location}
                </p>
              </div>
            ))}
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold mt-10 mb-6 flex items-center gap-2">
            <span className="text-primary">{num()}.</span>
            {dict.resume.certifications}
          </h2>
          <div className="space-y-3">
            {data.certifications.map((cert) => (
              <div key={cert.name} className="resume-item">
                <h3 className="text-base font-semibold">{cert.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {cert.issuer} ・ {cert.date}
                </p>
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <CredlyIcon className="h-3.5 w-3.5" />
                    {dict.resume.viewCredential}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-primary">{num()}.</span>
            {dict.resume.languages}
          </h2>
          <ul className="space-y-2">
            {data.languages.map((lang) => (
              <li key={lang.language} className="flex items-baseline justify-between gap-2 resume-item">
                <span className="font-medium">{lang.language}</span>
                <span className="text-sm text-muted-foreground text-right">{lang.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
