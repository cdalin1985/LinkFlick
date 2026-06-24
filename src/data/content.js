import {
  BadgeDollarSign,
  Bot,
  Captions,
  CirclePlay,
  Code2,
  Link,
  Megaphone,
  Sparkles,
  Wand2,
  Zap
} from "lucide-react";

export const sampleProductUrl = "shop.example.com/products/amazfit-gtr-4-smartwatch?aff=creator";

export const steps = [
  {
    title: "Paste Product URL",
    body: "Drop in any affiliate product link. LinkFlick normalizes the URL and pulls a usable product cue from it.",
    Icon: Link
  },
  {
    title: "AI Writes the Pitch",
    body: "Generate hooks, scripts, captions, hashtags, and a compliant short-form concept in one pass.",
    Icon: Sparkles
  },
  {
    title: "Generate Short Assets",
    body: "Copy the assets into your workflow or send the prompt to OpenAI video generation from the server route.",
    Icon: CirclePlay
  }
];

export const features = [
  {
    title: "Works with any link",
    body: "Amazon, Shopify, Whop, custom stores, or any affiliate URL.",
    Icon: Link
  },
  {
    title: "High-converting copy",
    body: "Hooks, scripts, captions, and CTAs shaped for short-form commerce.",
    Icon: Megaphone
  },
  {
    title: "Prompt for video AI",
    body: "Each concept includes a 9:16 Sora-ready prompt for real video jobs.",
    Icon: Wand2
  },
  {
    title: "Export and integrate",
    body: "Copy everything or connect the included API routes to your stack.",
    Icon: Code2
  }
];

export const examples = [
  {
    title: "Portable Blender",
    category: "Kitchen",
    hook: "Blend anywhere. Drink anywhere.",
    duration: "00:20",
    accent: "coral"
  },
  {
    title: "Running Shoes",
    category: "Sports",
    hook: "Cloud-like comfort. All day.",
    duration: "00:18",
    accent: "cyan"
  },
  {
    title: "Niacinamide Serum",
    category: "Beauty",
    hook: "Glow starts with the serum.",
    duration: "00:16",
    accent: "lime"
  },
  {
    title: "Handheld Vacuum",
    category: "Home",
    hook: "Small vacuum. Big power.",
    duration: "00:15",
    accent: "coral"
  },
  {
    title: "Car Mount",
    category: "Automotive",
    hook: "Secure grip. Zero distractions.",
    duration: "00:14",
    accent: "cyan"
  }
];

export const pricing = [
  {
    name: "Starter",
    price: "$19",
    credits: "2,000 credits / month",
    features: ["AI copy generation", "Video prompts", "Caption sets", "Copy exports"],
    featured: false
  },
  {
    name: "Pro",
    price: "$49",
    credits: "10,000 credits / month",
    features: ["Everything in Starter", "Brand voice", "Priority queues", "API access"],
    featured: true
  },
  {
    name: "Business",
    price: "$149",
    credits: "50,000 credits / month",
    features: ["Everything in Pro", "Team seats", "Advanced settings", "Dedicated support"],
    featured: false
  }
];

export const faqs = [
  {
    question: "What types of links does LinkFlick support?",
    answer: "Any public affiliate or product URL. The app normalizes the link and uses the URL structure as product context."
  },
  {
    question: "Can I use the assets for TikTok, Reels, and YouTube Shorts?",
    answer: "Yes. Scripts, captions, hashtags, and prompts are written for vertical short-form campaigns."
  },
  {
    question: "Do I need an API key?",
    answer: "The demo copy workflow runs without one. Real OpenAI copy and video generation requires OPENAI_API_KEY on the server."
  },
  {
    question: "What is a credit?",
    answer: "Credits represent generated copy batches or video jobs. Pricing is sample product UI for this build."
  }
];

export const statChips = [
  { label: "Any affiliate link", Icon: BadgeDollarSign },
  { label: "AI pitch engine", Icon: Bot },
  { label: "Captions and hashtags", Icon: Captions },
  { label: "Video generation path", Icon: Zap }
];
