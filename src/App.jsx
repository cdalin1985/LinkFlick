import { useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  ChevronDown,
  CirclePlay,
  Copy,
  ExternalLink,
  Gauge,
  Image as ImageIcon,
  Layers3,
  Link as LinkIcon,
  Loader2,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Video,
  WandSparkles,
  Zap
} from "lucide-react";
import {
  examples,
  faqs,
  features,
  pricing,
  sampleProductUrl,
  statChips,
  steps
} from "./data/content.js";
import {
  buildFallbackBrief,
  defaultTones,
  formatConceptForClipboard,
  normalizeAffiliateUrl,
  normalizeGeneratedBrief
} from "./lib/linkflick.js";

const defaultBrief = normalizeGeneratedBrief(
  buildFallbackBrief({
    productUrl: sampleProductUrl,
    tone: "Punchy"
  })
);

export default function App() {
  const [productUrl, setProductUrl] = useState("");
  const [tone, setTone] = useState(defaultTones[0]);
  const [brief, setBrief] = useState(defaultBrief);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNote, setGenerationNote] = useState("Demo assets are loaded so the product is usable immediately.");
  const [error, setError] = useState("");
  const [videoJobs, setVideoJobs] = useState({});
  const [videoLoading, setVideoLoading] = useState({});

  async function handleGenerate(event) {
    event?.preventDefault();
    setError("");
    setVideoJobs({});
    setVideoLoading({});
    setIsGenerating(true);

    try {
      const normalizedUrl = normalizeAffiliateUrl(productUrl || sampleProductUrl);
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productUrl: normalizedUrl,
          tone
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Server generation unavailable.");
      }

      const payload = await response.json();
      setBrief(normalizeGeneratedBrief(payload));
      setGenerationNote(
        payload.source === "openai"
          ? "Generated with the server-side OpenAI route."
          : "Generated in demo mode because no server API key is active."
      );
    } catch (generationError) {
      try {
        const fallbackBrief = buildFallbackBrief({
          productUrl: productUrl || sampleProductUrl,
          tone
        });
        setBrief(normalizeGeneratedBrief(fallbackBrief));
        setGenerationNote("Generated locally in demo mode because the API route was unavailable.");
      } catch {
        setError(generationError.message || "Enter a valid affiliate product URL.");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleVideoJob(concept) {
    setVideoLoading((current) => ({ ...current, [concept.id]: true }));
    setVideoJobs((current) => ({ ...current, [concept.id]: null }));

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: concept.videoPrompt,
          seconds: 8,
          size: "720x1280"
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Video generation is not configured.");
      }

      setVideoJobs((current) => ({ ...current, [concept.id]: payload }));
      await pollVideoJob(concept.id, payload.id);
    } catch (videoError) {
      setVideoJobs((current) => ({
        ...current,
        [concept.id]: {
          status: "setup_required",
          error: videoError.message || "Set OPENAI_API_KEY to create a video job."
        }
      }));
    } finally {
      setVideoLoading((current) => ({ ...current, [concept.id]: false }));
    }
  }

  async function pollVideoJob(conceptId, id) {
    if (!id) {
      return;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await wait(1800);
      const response = await fetch(`/api/videos/${encodeURIComponent(id)}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setVideoJobs((current) => ({
          ...current,
          [conceptId]: {
            id,
            status: "error",
            error: payload.error || "Unable to poll video job."
          }
        }));
        return;
      }

      setVideoJobs((current) => ({ ...current, [conceptId]: payload }));

      if (["completed", "failed", "cancelled"].includes(payload.status)) {
        return;
      }
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to generator
      </a>
      <Header />

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="launch-badge">
              <Radio size={16} aria-hidden="true" />
              <span>Live affiliate creative rig</span>
            </div>
            <h1>
              Turn any affiliate link into <span>three short-form sales angles</span>
            </h1>
            <p>
              Paste a product URL once. LinkFlick turns the product context into three distinct
              concepts, each with its own hook, script, caption, hashtags, and video prompt.
            </p>
          </div>

          <form className="generator-bar" onSubmit={handleGenerate}>
            <div className="generator-field">
              <label htmlFor="affiliate-product-url">Affiliate product URL</label>
              <div className="url-input">
                <LinkIcon size={18} aria-hidden="true" />
                <input
                  id="affiliate-product-url"
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  placeholder="https://store.com/product?aff=you"
                  aria-describedby="affiliate-product-help"
                  inputMode="url"
                  autoComplete="url"
                />
              </div>
              <span id="affiliate-product-help">Public product pages work best.</span>
            </div>
            <button className="primary-button" type="submit" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              Generate Shorts
            </button>
          </form>

          <div className="hero-options" aria-label="Generation options">
            <SegmentedControl label="Tone" value={tone} options={defaultTones} onChange={setTone} />
          </div>

          {error ? (
            <p className="error-line" role="alert">
              {error}
            </p>
          ) : (
            <p className="status-line" role="status" aria-live="polite">
              {generationNote}
            </p>
          )}

          <HeroSignalDeck />
          <CampaignMeters brief={brief} />

          <GeneratorPreview
            brief={brief}
            onRegenerate={handleGenerate}
            onVideoJob={handleVideoJob}
            videoLoading={videoLoading}
            videoJobs={videoJobs}
          />
        </section>

        <StatRail />
        <HowItWorks />
        <FeatureGrid />
        <Examples />
        <Pricing />
        <FAQ />
        <FinalCTA
          productUrl={productUrl}
          setProductUrl={setProductUrl}
          isGenerating={isGenerating}
          handleGenerate={handleGenerate}
        />
      </main>

      <Footer />
    </div>
  );
}

function HeroSignalDeck() {
  return (
    <div className="signal-deck" aria-label="LinkFlick generation status">
      <span>Product scan</span>
      <i aria-hidden="true" />
      <span>Three angles</span>
      <i aria-hidden="true" />
      <span>Video queue</span>
    </div>
  );
}

function CampaignMeters({ brief }) {
  const concepts = brief.concepts || [];
  const meters = [
    { label: "Concepts", value: concepts.length, Icon: Sparkles },
    { label: "Hooks", value: concepts.filter((concept) => concept.hook).length, Icon: Layers3 },
    { label: "Scripts", value: concepts.filter((concept) => concept.script).length, Icon: Copy },
    { label: "Prompts", value: concepts.filter((concept) => concept.videoPrompt).length, Icon: Gauge }
  ];

  return (
    <div className="campaign-meters" aria-label="Generated campaign asset counts">
      {meters.map(({ label, value, Icon }) => (
        <div key={label}>
          <Icon size={17} aria-hidden="true" />
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="LinkFlick home">
        <span className="brand-mark">
          <Zap size={22} fill="currentColor" aria-hidden="true" />
        </span>
        <span>LinkFlick</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#pricing">Pricing</a>
        <a href="#api">API</a>
        <a href="#examples">Examples</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a className="header-cta" href="#top">
        <WandSparkles size={16} aria-hidden="true" />
        Generate
      </a>
    </header>
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="segmented" aria-label={label}>
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={option === value ? "active" : ""}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function GeneratorPreview({
  brief,
  onRegenerate,
  onVideoJob,
  videoLoading,
  videoJobs
}) {
  const productContext = brief.productContext || {};
  const [copyStatus, setCopyStatus] = useState("");

  async function copyAsset(text, label) {
    try {
      await writeClipboard(text);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus("Copy failed. Select the text and try again.");
    }
    window.setTimeout(() => setCopyStatus(""), 2600);
  }

  return (
    <section className="product-preview" aria-label="Generated short assets">
      <aside className="preview-sidebar">
        <div className="brand mini">
          <span className="brand-mark">
            <Zap size={17} fill="currentColor" aria-hidden="true" />
          </span>
          <span>LinkFlick</span>
        </div>
        {["Dashboard", "Projects", "Templates", "History", "Brand Voice", "API Keys", "Settings"].map(
          (item, index) => (
            <div
              className={index === 0 ? "sidebar-item active" : "sidebar-item"}
              aria-current={index === 0 ? "page" : undefined}
              key={item}
            >
              <span />
              {item}
            </div>
          )
        )}
        <div className="credit-box">
          <strong>Pro Plan</strong>
          <span>12,430 / 50,000 credits used</span>
          <div className="meter">
            <i />
          </div>
          <a href="#pricing">Upgrade Plan</a>
        </div>
      </aside>

      <div className="preview-main">
        <div className="preview-topbar">
          <div className="product-identity">
            <span className="product-thumb">
              {productContext.image ? (
                <img src={productContext.image} alt={`${brief.productName} product`} />
              ) : (
                <Video size={24} aria-hidden="true" />
              )}
            </span>
            <div>
              <h2>{brief.productName}</h2>
              <a href={brief.productUrl} target="_blank" rel="noreferrer">
                {brief.productUrl}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={onRegenerate}>
              <RefreshCw size={15} aria-hidden="true" />
              Regenerate all
            </button>
            <button type="button" onClick={() => copyAsset(formatBriefForClipboard(brief), "Creative brief")}>
              <Copy size={15} aria-hidden="true" />
              Copy all
            </button>
          </div>
        </div>

        <ProductIntelStrip brief={brief} />

        <p className="copy-status" role="status" aria-live="polite">
          {copyStatus}
        </p>

        <div className="concept-heading">
          <div>
            <span>One product - three selling strategies</span>
            <h3>Your campaign concepts</h3>
          </div>
          <p>Each direction is ready to film, post, or send to video generation.</p>
        </div>

        <div className="concept-grid">
          {brief.concepts.map((concept, index) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              productName={brief.productName}
              productContext={productContext}
              accentIndex={index}
              onCopy={copyAsset}
              onVideoJob={() => onVideoJob(concept)}
              isVideoLoading={Boolean(videoLoading[concept.id])}
              videoJob={videoJobs[concept.id]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ConceptCard({
  concept,
  productName,
  productContext,
  accentIndex,
  onCopy,
  onVideoJob,
  isVideoLoading,
  videoJob
}) {
  const videoContentUrl =
    videoJob?.status === "completed" && videoJob?.id ? `/api/videos/${videoJob.id}/content` : "";
  const jobLabel = videoJob?.error
    ? videoJob.error
    : videoJob
      ? `Video job: ${videoJob.status || "queued"}`
      : "Ready to send prompt";

  return (
    <article className={`concept-card accent-${accentIndex + 1}`}>
      <header className="concept-card-header">
        <span>{concept.angle}</span>
        <button
          type="button"
          onClick={() => onCopy(formatConceptForClipboard(concept), `${concept.angle} concept`)}
          aria-label={`Copy all ${concept.angle} assets`}
        >
          <Copy size={14} aria-hidden="true" />
          Copy all
        </button>
      </header>

      <div className="concept-hook">
        <div>
          <span>Hook</span>
          <button type="button" onClick={() => onCopy(concept.hook, `${concept.angle} hook`)}>
            <Copy size={13} aria-hidden="true" />
            Copy
          </button>
        </div>
        <h3>{concept.hook}</h3>
      </div>

      <ConceptSection
        label={`Script - ${concept.script.duration}`}
        copyText={[
          concept.script.title,
          ...concept.script.lines,
          `CTA: ${concept.script.cta}`
        ].join("\n")}
        onCopy={onCopy}
      >
        <strong>{concept.script.title}</strong>
        <ol>
          {concept.script.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p className="concept-cta">CTA: {concept.script.cta}</p>
      </ConceptSection>

      <ConceptSection label="Caption" copyText={concept.caption} onCopy={onCopy}>
        <p>{concept.caption}</p>
      </ConceptSection>

      <ConceptSection label="Hashtags" copyText={concept.hashtags.join(" ")} onCopy={onCopy}>
        <div className="concept-tags">
          {concept.hashtags.map((hashtag) => (
            <span key={hashtag}>{hashtag}</span>
          ))}
        </div>
      </ConceptSection>

      <ConceptSection label="Video prompt" copyText={concept.videoPrompt} onCopy={onCopy}>
        <p>{concept.videoPrompt}</p>
      </ConceptSection>

      <div className="concept-video">
        {videoContentUrl ? (
          <video src={videoContentUrl} controls playsInline />
        ) : (
          <div className="concept-video-placeholder">
            {productContext.image ? (
              <img src={productContext.image} alt="" />
            ) : (
              <Video size={23} aria-hidden="true" />
            )}
            <span>{productName}</span>
          </div>
        )}
        <button type="button" onClick={onVideoJob} disabled={isVideoLoading}>
          {isVideoLoading ? <Loader2 className="spin" size={17} /> : <Send size={17} />}
          Create video
        </button>
        <p
          className={videoJob?.error ? "video-status error" : "video-status"}
          role="status"
          aria-live="polite"
        >
          {jobLabel}
        </p>
      </div>
    </article>
  );
}

function ConceptSection({ label, copyText, onCopy, children }) {
  return (
    <section className="concept-section">
      <div>
        <span>{label}</span>
        <button type="button" onClick={() => onCopy(copyText, label)}>
          <Copy size={13} aria-hidden="true" />
          Copy
        </button>
      </div>
      {children}
    </section>
  );
}

function ProductIntelStrip({ brief }) {
  const context = brief.productContext || {};
  const bullets = Array.isArray(context.bullets) ? context.bullets.slice(0, 3) : [];
  const fallbackBullets = brief.concepts[0]?.script?.lines?.slice(1, 4) || [];
  const visibleBullets = bullets.length ? bullets : fallbackBullets;

  return (
    <section className="product-intel" aria-label="Extracted product intelligence">
      <div className="intel-image">
        {context.image ? (
          <img src={context.image} alt={`${brief.productName} product preview`} />
        ) : (
          <ImageIcon size={26} aria-hidden="true" />
        )}
      </div>
      <div className="intel-copy">
        <span>Product intel</span>
        <strong>{context.brand || brief.productName}</strong>
        <p>{context.description || "Context-aware creative angles are generated from the product page and URL."}</p>
      </div>
      <div className="intel-price">
        <BadgeDollarSign size={18} aria-hidden="true" />
        <strong>{context.price ? `${context.currency || "$"} ${context.price}`.trim() : "Scan ready"}</strong>
        <span>{context.price ? "Detected price" : "Fallback mode"}</span>
      </div>
      <ul>
        {visibleBullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}

function StatRail() {
  return (
    <section className="stat-rail" aria-label="LinkFlick capabilities">
      {statChips.map(({ label, Icon }) => (
        <div key={label}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section how" aria-labelledby="how-heading">
      <h2 id="how-heading">How It Works</h2>
      <div className="steps">
        {steps.map(({ title, body, Icon }, index) => (
          <article key={title}>
            <span className="step-number">{index + 1}</span>
            <div className="step-icon">
              <Icon size={30} aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="section features" id="api" aria-labelledby="features-heading">
      <h2 id="features-heading">Built for Affiliate Growth</h2>
      <div className="feature-grid">
        {features.map(({ title, body, Icon }) => (
          <article key={title}>
            <Icon size={28} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Examples() {
  return (
    <section className="section examples" id="examples" aria-labelledby="examples-heading">
      <h2 id="examples-heading">Example Shorts</h2>
      <div className="example-grid">
        {examples.map((example) => (
          <article className={`example-card ${example.accent}`} key={example.title}>
            <div className="example-video">
              <img src="/assets/shorts-montage.png" alt="" loading="lazy" decoding="async" />
              <strong>{example.hook}</strong>
              <span>
                <CirclePlay size={14} fill="currentColor" aria-hidden="true" />
                {example.duration}
              </span>
            </div>
            <h3>{example.title}</h3>
            <p>{example.category}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="section pricing" id="pricing" aria-labelledby="pricing-heading">
      <h2 id="pricing-heading">Simple, Transparent Pricing</h2>
      <div className="pricing-grid">
        {pricing.map((plan) => (
          <article className={plan.featured ? "price-card featured" : "price-card"} key={plan.name}>
            {plan.featured ? <span className="popular">Most Popular</span> : null}
            <h3>{plan.name}</h3>
            <div className="price-row">
              <strong>{plan.price}</strong>
              <span>/ month</span>
            </div>
            <p>{plan.credits}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check size={16} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <button type="button">Get Started</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className="section faq" id="faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question}>
            <summary>
              {faq.question}
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ productUrl, setProductUrl, isGenerating, handleGenerate }) {
  return (
    <section className="final-cta" aria-label="Generate affiliate shorts">
      <div>
        <h2>Ready to turn links into high-converting shorts?</h2>
        <p>Paste your affiliate link and generate in seconds.</p>
      </div>
      <form className="mini-generator" onSubmit={handleGenerate}>
        <label>
          <LinkIcon size={16} aria-hidden="true" />
          <span className="sr-only">Paste affiliate product URL</span>
          <input
            value={productUrl}
            onChange={(event) => setProductUrl(event.target.value)}
            placeholder="Paste affiliate product URL"
          />
        </label>
        <button type="submit" disabled={isGenerating}>
          Generate Shorts
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>Copyright 2026 LinkFlick. All rights reserved.</span>
      <div>
        <a href="#top">Terms</a>
        <a href="#top">Privacy</a>
        <a href="#top">Contact</a>
      </div>
    </footer>
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatBriefForClipboard(brief) {
  return [
    brief.productName,
    brief.productUrl,
    "",
    ...brief.concepts.flatMap((concept, index) => [
      `CONCEPT ${index + 1}`,
      formatConceptForClipboard(concept),
      ""
    ])
  ].join("\n");
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
