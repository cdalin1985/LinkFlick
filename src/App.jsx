import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CirclePlay,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Video,
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
  defaultAngles,
  defaultTones,
  normalizeAffiliateUrl
} from "./lib/linkflick.js";

const defaultBrief = buildFallbackBrief({
  productUrl: sampleProductUrl,
  angle: "Problem-solution",
  tone: "Punchy"
});

export default function App() {
  const [productUrl, setProductUrl] = useState("");
  const [angle, setAngle] = useState(defaultAngles[0]);
  const [tone, setTone] = useState(defaultTones[0]);
  const [brief, setBrief] = useState(defaultBrief);
  const [activeTab, setActiveTab] = useState("hooks");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNote, setGenerationNote] = useState("Demo assets are loaded so the product is usable immediately.");
  const [error, setError] = useState("");
  const [videoJob, setVideoJob] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const selectedScript = brief.scripts[0];
  const videoContentUrl = videoJob?.status === "completed" && videoJob?.id ? `/api/videos/${videoJob.id}/content` : "";

  async function handleGenerate(event) {
    event.preventDefault();
    setError("");
    setVideoJob(null);
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
          angle,
          tone
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Server generation unavailable.");
      }

      const payload = await response.json();
      setBrief(payload);
      setGenerationNote(
        payload.source === "openai"
          ? "Generated with the server-side OpenAI route."
          : "Generated in demo mode because no server API key is active."
      );
    } catch (generationError) {
      try {
        const fallbackBrief = buildFallbackBrief({
          productUrl: productUrl || sampleProductUrl,
          angle,
          tone
        });
        setBrief(fallbackBrief);
        setGenerationNote("Generated locally in demo mode because the API route was unavailable.");
      } catch {
        setError(generationError.message || "Enter a valid affiliate product URL.");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleVideoJob() {
    setIsVideoLoading(true);
    setVideoJob(null);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: brief.videoPrompt,
          seconds: 8,
          size: "720x1280"
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Video generation is not configured.");
      }

      setVideoJob(payload);
      await pollVideoJob(payload.id);
    } catch (videoError) {
      setVideoJob({
        status: "setup_required",
        error: videoError.message || "Set OPENAI_API_KEY to create a video job."
      });
    } finally {
      setIsVideoLoading(false);
    }
  }

  async function pollVideoJob(id) {
    if (!id) {
      return;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await wait(1800);
      const response = await fetch(`/api/videos/${encodeURIComponent(id)}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setVideoJob({
          id,
          status: "error",
          error: payload.error || "Unable to poll video job."
        });
        return;
      }

      setVideoJob(payload);

      if (["completed", "failed", "cancelled"].includes(payload.status)) {
        return;
      }
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main>
        <section className="hero" id="top">
          <div className="hero-copy">
            <h1>Turn any affiliate link into short-form product pitches</h1>
            <p>
              Paste a product URL. LinkFlick writes the hook, script, caption, hashtags, and video
              prompt for your next affiliate short.
            </p>
          </div>

          <form className="generator-bar" onSubmit={handleGenerate}>
            <label className="url-input">
              <LinkIcon size={18} aria-hidden="true" />
              <span className="sr-only">Paste affiliate product URL</span>
              <input
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="Paste affiliate product URL"
              />
            </label>
            <button className="primary-button" type="submit" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              Generate Shorts
            </button>
          </form>

          <div className="hero-options" aria-label="Generation options">
            <SegmentedControl label="Angle" value={angle} options={defaultAngles} onChange={setAngle} />
            <SegmentedControl label="Tone" value={tone} options={defaultTones} onChange={setTone} />
          </div>

          {error ? <p className="error-line">{error}</p> : <p className="status-line">{generationNote}</p>}

          <GeneratorPreview
            brief={brief}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedScript={selectedScript}
            onVideoJob={handleVideoJob}
            isVideoLoading={isVideoLoading}
            videoJob={videoJob}
            videoContentUrl={videoContentUrl}
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
        Generate Shorts
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
  activeTab,
  onTabChange,
  selectedScript,
  onVideoJob,
  isVideoLoading,
  videoJob,
  videoContentUrl
}) {
  const tabs = [
    ["hooks", "Hooks"],
    ["script", "Script"],
    ["captions", "Captions"],
    ["hashtags", "Hashtags"],
    ["prompt", "Video Prompt"]
  ];

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
            <button className={index === 0 ? "sidebar-item active" : "sidebar-item"} key={item}>
              <span />
              {item}
            </button>
          )
        )}
        <div className="credit-box">
          <strong>Pro Plan</strong>
          <span>12,430 / 50,000 credits used</span>
          <div className="meter">
            <i />
          </div>
          <button type="button">Upgrade Plan</button>
        </div>
      </aside>

      <div className="preview-main">
        <div className="preview-topbar">
          <div className="product-identity">
            <span className="product-thumb">
              <Video size={24} aria-hidden="true" />
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
            <button type="button">
              <RefreshCw size={15} aria-hidden="true" />
              Regenerate
            </button>
            <button type="button">
              <Copy size={15} aria-hidden="true" />
              Copy
            </button>
          </div>
        </div>

        <div className="preview-grid">
          <div className="asset-panel">
            <div className="tabs" role="tablist" aria-label="Generated asset tabs">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  className={activeTab === id ? "active" : ""}
                  onClick={() => onTabChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <AssetContent brief={brief} activeTab={activeTab} selectedScript={selectedScript} />
          </div>

          <ShortPreview
            brief={brief}
            onVideoJob={onVideoJob}
            isVideoLoading={isVideoLoading}
            videoJob={videoJob}
            videoContentUrl={videoContentUrl}
          />
        </div>
      </div>
    </section>
  );
}

function AssetContent({ brief, activeTab, selectedScript }) {
  if (activeTab === "hooks") {
    return (
      <ol className="hook-list">
        {brief.hooks.map((hook, index) => (
          <li key={hook}>
            <span>{index + 1}</span>
            <p>{hook}</p>
            <Copy size={15} aria-hidden="true" />
          </li>
        ))}
      </ol>
    );
  }

  if (activeTab === "script") {
    return (
      <div className="script-box">
        <div>
          <strong>{selectedScript.title}</strong>
          <span>{selectedScript.duration}</span>
        </div>
        <ul>
          {selectedScript.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>{selectedScript.cta}</p>
      </div>
    );
  }

  if (activeTab === "captions") {
    return (
      <div className="caption-stack">
        {brief.captions.map((caption) => (
          <article key={caption}>
            <p>{caption}</p>
            <button type="button">
              <Copy size={14} aria-hidden="true" />
              Copy
            </button>
          </article>
        ))}
      </div>
    );
  }

  if (activeTab === "hashtags") {
    return (
      <div className="hashtag-cloud">
        {brief.hashtags.map((hashtag) => (
          <span key={hashtag}>{hashtag}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="prompt-box">
      <p>{brief.videoPrompt}</p>
    </div>
  );
}

function ShortPreview({ brief, onVideoJob, isVideoLoading, videoJob, videoContentUrl }) {
  const jobLabel = useMemo(() => {
    if (!videoJob) {
      return "Ready to send prompt";
    }
    if (videoJob.error) {
      return videoJob.error;
    }
    return `Video job: ${videoJob.status || "queued"}`;
  }, [videoJob]);

  return (
    <aside className="short-preview">
      <div className="phone-frame">
        {videoContentUrl ? (
          <video src={videoContentUrl} controls playsInline />
        ) : (
          <div className="mock-video">
            <img src="/assets/shorts-montage.png" alt="" />
            <div className="video-overlay">
              <strong>{brief.hooks[0]}</strong>
              <span>{brief.productName}</span>
            </div>
            <div className="video-actions" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
      <button className="video-button" type="button" onClick={onVideoJob} disabled={isVideoLoading}>
        {isVideoLoading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        Create OpenAI Video Job
      </button>
      <p className={videoJob?.error ? "video-status error" : "video-status"}>{jobLabel}</p>
    </aside>
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
              <img src="/assets/shorts-montage.png" alt="" />
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
      <span>© 2026 LinkFlick. All rights reserved.</span>
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
