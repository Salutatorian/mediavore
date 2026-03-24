import React from "react";
import { motion } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";

export type LegalPageType = "terms" | "privacy" | "dmca" | "about";

const CONTACT_EMAIL = "dmca@mediavore.app";

function TermsContent() {
  return (
    <>
      <p className="text-white/30 text-xs font-mono mb-6">
        Last updated: March 2026
      </p>

      <Section title="1. Acceptance">
        By accessing or using Mediavore ("the Service"), you agree to be bound
        by these Terms of Service. If you do not agree, do not use the Service.
      </Section>

      <Section title="2. Nature of the Service">
        Mediavore is a technical tool that acts as an intermediary between the
        user and publicly available media platforms. It does not host, store, or
        distribute any media content. All downloads are initiated by the user
        and processed in real time — no files are retained on our servers after
        delivery.
      </Section>

      <Section title="3. User Responsibility">
        <strong className="text-white/70">
          You are solely responsible for the content you download.
        </strong>{" "}
        You must have the legal right to access and download any media you
        request through Mediavore. By using the Service, you represent and
        warrant that:
        <ul className="list-disc pl-5 mt-2 space-y-1 text-white/35">
          <li>
            You own the content, or have explicit permission from the copyright
            holder.
          </li>
          <li>
            Your use falls within the scope of fair use, personal backup, or
            research as defined by the laws of your jurisdiction.
          </li>
          <li>
            You will not use downloaded content for commercial redistribution or
            profit without authorization.
          </li>
        </ul>
      </Section>

      <Section title="4. Prohibited Use">
        You may not use Mediavore to:
        <ul className="list-disc pl-5 mt-2 space-y-1 text-white/35">
          <li>
            Infringe upon any copyright, trademark, or other intellectual
            property right.
          </li>
          <li>
            Distribute, sell, or commercially exploit downloaded content without
            authorization.
          </li>
          <li>
            Circumvent digital rights management (DRM) protections where
            prohibited by law.
          </li>
          <li>
            Engage in automated bulk downloading or scraping beyond personal
            use.
          </li>
          <li>Violate the terms of service of any third-party platform.</li>
        </ul>
      </Section>

      <Section title="5. No Warranty">
        The Service is provided{" "}
        <strong className="text-white/70">"AS IS"</strong> and{" "}
        <strong className="text-white/70">"AS AVAILABLE"</strong> without
        warranties of any kind, either express or implied. Mediavore does not
        guarantee uninterrupted access, compatibility with any specific
        platform, or the quality of downloaded media. Third-party platforms may
        change their infrastructure at any time, which may temporarily or
        permanently affect functionality.
      </Section>

      <Section title="6. Limitation of Liability">
        In no event shall Mediavore, its operators, or contributors be liable
        for any indirect, incidental, special, consequential, or punitive
        damages arising from your use of the Service, including but not limited
        to loss of data, loss of revenue, or inability to download content.
      </Section>

      <Section title="7. Termination">
        We reserve the right to suspend or terminate access to the Service at
        any time, for any reason, without prior notice. Users who violate these
        Terms may be permanently blocked.
      </Section>

      <Section title="8. Changes to Terms">
        We may update these Terms at any time. Continued use of the Service
        after changes constitutes acceptance of the new Terms. We recommend
        checking this page periodically.
      </Section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p className="text-white/30 text-xs font-mono mb-6">
        Last updated: March 2026
      </p>

      <Section title="1. Overview">
        Mediavore is designed with privacy as a core principle. We believe in
        minimal data collection — if we don't need your data, we don't take it.
      </Section>

      <Section title="2. What We Don't Collect">
        <ul className="list-disc pl-5 mt-1 space-y-1 text-white/35">
          <li>
            <strong className="text-white/50">No accounts.</strong> Mediavore
            does not require registration or login.
          </li>
          <li>
            <strong className="text-white/50">No cookies or trackers.</strong>{" "}
            We do not use analytics cookies, tracking pixels, or third-party
            advertising scripts.
          </li>
          <li>
            <strong className="text-white/50">No download history.</strong>{" "}
            We do not log which URLs you paste or what you download. Once the
            stream is delivered, the temporary file is deleted and no record is
            kept.
          </li>
          <li>
            <strong className="text-white/50">No fingerprinting.</strong> We do
            not collect browser fingerprints, device identifiers, or behavioral
            profiles.
          </li>
        </ul>
      </Section>

      <Section title="3. What May Be Collected">
        <ul className="list-disc pl-5 mt-1 space-y-1 text-white/35">
          <li>
            <strong className="text-white/50">Server logs.</strong> Standard web
            server logs may temporarily record IP addresses, request timestamps,
            and HTTP status codes for operational purposes (error diagnosis,
            rate-limiting, abuse prevention). These logs are not sold, shared, or
            used for profiling, and are rotated automatically.
          </li>
        </ul>
      </Section>

      <Section title="4. Third-Party Platforms">
        When you paste a URL, Mediavore sends a request to the corresponding
        platform (YouTube, TikTok, Instagram, etc.) on your behalf. That
        platform's own privacy policy governs how they process that request.
        Mediavore does not control or have visibility into what data those
        platforms collect about you or the request.
      </Section>

      <Section title="5. Cookies File (Optional)">
        For platforms requiring authentication (e.g., Twitter/X, Instagram), you
        may optionally provide a browser cookies file. This file is stored
        locally on the server and is never transmitted to any third party. If
        you self-host Mediavore, you retain full control over this file.
      </Section>

      <Section title="6. Data Retention">
        Mediavore processes downloads in real time using temporary files that are
        deleted immediately after the stream is delivered to your browser. No
        media files, metadata, or user content is retained after the request
        completes.
      </Section>

      <Section title="7. Children's Privacy">
        Mediavore is not directed at children under 13 (or the applicable age in
        your jurisdiction). We do not knowingly collect information from
        children.
      </Section>

      <Section title="8. Your Rights">
        Under regulations such as GDPR (EU) and CCPA (California), you have the
        right to request access to, correction of, or deletion of any personal
        data we hold. Since we do not collect persistent personal data, such
        requests will typically result in confirmation that no data is stored.
        Contact us at{" "}
        <span className="text-violet-400/70 font-mono">{CONTACT_EMAIL}</span>{" "}
        for any privacy-related inquiries.
      </Section>

      <Section title="9. Changes">
        We may update this Privacy Policy to reflect changes in practice or law.
        The "Last updated" date at the top indicates the latest revision.
      </Section>
    </>
  );
}

function DmcaContent() {
  return (
    <>
      <p className="text-white/30 text-xs font-mono mb-6">
        Last updated: March 2026
      </p>

      <Section title="1. Respect for Copyright">
        Mediavore respects the intellectual property rights of content creators
        and copyright holders. We respond promptly to valid takedown notices
        submitted under the Digital Millennium Copyright Act (DMCA) and
        equivalent international frameworks.
      </Section>

      <Section title="2. How Mediavore Works">
        Mediavore does not host, cache, or index any copyrighted material. It is
        a real-time processing tool that fetches publicly accessible media from
        third-party platforms at the user's explicit request. No content is
        stored on our servers after delivery.
      </Section>

      <Section title="3. Filing a Takedown Notice">
        If you believe that your copyrighted work is being accessed through
        Mediavore in a manner that constitutes infringement, please send a
        written notification to:
        <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] font-mono text-sm text-violet-400/70">
          {CONTACT_EMAIL}
        </div>
        <p className="mt-3 text-white/35">
          Your notice must include:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-white/35">
          <li>
            Identification of the copyrighted work you believe is being
            infringed.
          </li>
          <li>
            The URL(s) or description of where the infringing activity is
            occurring.
          </li>
          <li>
            Your contact information (name, email, phone number).
          </li>
          <li>
            A statement that you have a good-faith belief that the use is not
            authorized by the copyright owner, its agent, or the law.
          </li>
          <li>
            A statement, under penalty of perjury, that the information in the
            notice is accurate and that you are authorized to act on behalf of
            the copyright owner.
          </li>
          <li>Your physical or electronic signature.</li>
        </ul>
      </Section>

      <Section title="4. Repeat Infringer Policy">
        Mediavore maintains a policy for addressing repeat infringers. Users or
        IP addresses that are the subject of multiple valid DMCA complaints may
        be permanently blocked from accessing the Service.
      </Section>

      <Section title="5. Counter-Notification">
        If you believe your content was removed in error, you may submit a
        counter-notification to the email address above, including the
        information required under 17 U.S.C. &sect; 512(g).
      </Section>

      <Section title="6. Disclaimer">
        Mediavore is a neutral technical tool. Support for a platform does not
        imply endorsement of or affiliation with that platform or its content.
        We do not evaluate the legality of individual downloads — that
        responsibility lies with the user.
      </Section>
    </>
  );
}

function AboutContent() {
  return (
    <>
      {/* Disclaimer banner */}
      <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.04] p-4 mb-8">
        <p className="text-[13px] text-white/50 leading-relaxed">
          Mediavore is a technical tool designed for personal use, research, and
          archiving. It does not host any media on its servers. Support for a
          service does not imply affiliation or endorsement.
        </p>
      </div>

      <Section title="What is Mediavore?">
        Mediavore is an open-source media downloader built from scratch.
        Paste a link, pick your format, and the file lands in your Downloads
        folder. No accounts, no ads, no tracking — just the content you asked
        for, delivered cleanly.
      </Section>

      <Section title="Always Fresh">
        Platforms change their code constantly. Mediavore runs automatic engine
        updates every 12 hours to stay ahead of breakage. When YouTube, TikTok,
        or Instagram change their internals, Mediavore adapts — usually before
        you even notice.
      </Section>

      <Section title="Native Feel">
        Mediavore is a Progressive Web App. Add it to your iPhone or Android
        home screen and it looks and feels like a native app — no app store
        required, no Apple Shortcuts workaround. On iOS Safari, downloads go
        straight to your Files app.
      </Section>

      <Section title="The Vibe">
        Dark. Fluid. Minimal. Mediavore's interface is built around a single
        glowing input — paste a link and the controls morph into exactly what you
        need. No clutter, no settings avalanche, no twelve-step wizard. Just the
        input, the options, and Devour.
      </Section>

      <Section title="Privacy First">
        No cookies, no analytics, no download history. Temporary files are
        deleted the moment your download completes. We don't know what you
        downloaded, and we'd like to keep it that way.
      </Section>

      <Section title="Built With">
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            "React",
            "TypeScript",
            "Framer Motion",
            "TailwindCSS",
            "FastAPI",
            "yt-dlp",
            "FFmpeg",
          ].map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-violet-400/60 bg-violet-500/[0.08] border border-violet-500/10"
            >
              {tech}
            </span>
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-[15px] font-bold text-white/70 mb-2 tracking-wide">
        {title}
      </h3>
      <div className="text-[13px] text-white/40 leading-relaxed">{children}</div>
    </div>
  );
}

const PAGE_CONFIG: Record<
  LegalPageType,
  { title: string; component: () => React.ReactNode }
> = {
  terms: { title: "TERMS OF SERVICE", component: TermsContent },
  privacy: { title: "PRIVACY POLICY", component: PrivacyContent },
  dmca: { title: "DMCA POLICY", component: DmcaContent },
  about: { title: "ABOUT", component: AboutContent },
};

export default function LegalPage({
  page,
  onClose,
}: {
  page: LegalPageType;
  onClose: () => void;
}) {
  const config = PAGE_CONFIG[page];
  const Content = config.component;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 top-[4%] mx-auto max-w-2xl z-50 flex flex-col"
      >
        <div className="glass rounded-t-2xl flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-display tracking-[0.15em] text-white/80">
                {config.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <Content />
          </div>
        </div>
      </motion.div>
    </>
  );
}
