"use client";

import React, { useState, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  Server,
  Building2,
  CreditCard,
  Users,
  Wrench,
  Smartphone,
  HelpCircle,
  Key,
  Database,
  RefreshCw,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
  X,
} from "lucide-react";
import {
  DocArticle,
  DocAudience,
  DocCategory,
  DOCS_ARTICLES,
  CATEGORY_DEFINITIONS,
} from "@/lib/docs/docsData";
import { searchDocs } from "@/lib/docs/searchEngine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface DocumentationHubProps {
  onNavigateTab?: (tabId: string) => void;
  className?: string;
}

export function DocumentationHub({ onNavigateTab, className }: DocumentationHubProps) {
  const [audience, setAudience] = useState<DocAudience>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | "all">("all");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);

  // Filter categories by active audience
  const availableCategories = useMemo(() => {
    const entries = Object.entries(CATEGORY_DEFINITIONS) as [
      DocCategory,
      (typeof CATEGORY_DEFINITIONS)[DocCategory]
    ][];
    return entries.filter(([_, def]) => def.audience === audience);
  }, [audience]);

  // Run indexed search with fuzzy suggestions
  const searchResponse = useMemo(() => {
    return searchDocs(searchQuery, {
      audience,
      category: selectedCategory,
    });
  }, [searchQuery, audience, selectedCategory]);

  const { results, didYouMean, totalCount } = searchResponse;

  // Handle Copy Code Snippet
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(id);
    toast.success("Code snippet copied to clipboard");
    setTimeout(() => setCopiedCodeIndex(null), 2500);
  };

  // Download Full Handover Kit (Markdown)
  const handleDownloadHandoverKit = () => {
    try {
      toast.loading("Generating full IT Handover & Architecture Package...", {
        id: "handover-kit",
      });

      const itArticles = DOCS_ARTICLES.filter((a) => a.audience === "it");
      const userArticles = DOCS_ARTICLES.filter((a) => a.audience === "user");

      let md = `# iReside — System Ownership & Client Handover Package\n`;
      md += `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n\n`;
      md += `This document serves as the complete technical, operational, and user handover kit for the iReside property management deployment.\n\n`;
      md += `---\n\n`;

      md += `## PART 1: IT Personnel & Maintainer Runbook\n\n`;
      itArticles.forEach((art, index) => {
        md += `### 1.${index + 1} ${art.title}\n`;
        md += `**Category:** ${art.categoryLabel} | **Read Time:** ${art.readTime} | **Difficulty:** ${art.difficulty.toUpperCase()}\n\n`;
        md += `> ${art.summary}\n\n`;
        if (art.steps) {
          art.steps.forEach((s, sIdx) => {
            md += `#### Step ${sIdx + 1}: ${s.title}\n`;
            md += `${s.description}\n\n`;
            if (s.codeSnippet) {
              md += `\`\`\`bash\n${s.codeSnippet}\n\`\`\`\n\n`;
            }
          });
        }
        if (art.contentMarkdown) {
          md += `${art.contentMarkdown}\n\n`;
        }
        md += `---\n\n`;
      });

      md += `## PART 2: Property Owner & Resident User Manual\n\n`;
      userArticles.forEach((art, index) => {
        md += `### 2.${index + 1} ${art.title}\n`;
        md += `**Category:** ${art.categoryLabel}\n\n`;
        md += `> ${art.summary}\n\n`;
        if (art.steps) {
          art.steps.forEach((s, sIdx) => {
            md += `#### Step ${sIdx + 1}: ${s.title}\n`;
            md += `${s.description}\n\n`;
          });
        }
        md += `---\n\n`;
      });

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `iReside_Complete_System_Handover_Kit.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Handover kit exported successfully!", { id: "handover-kit" });
    } catch (err) {
      console.error("Error generating handover kit:", err);
      toast.error("Failed to generate handover kit.", { id: "handover-kit" });
    }
  };

  // Render Icon Dynamically
  const getCategoryIcon = (category: DocCategory) => {
    switch (category) {
      case "property_setup":
        return <Building2 className="size-4" />;
      case "billing_payments":
        return <CreditCard className="size-4" />;
      case "tenants_leases":
        return <Users className="size-4" />;
      case "maintenance_tickets":
        return <Wrench className="size-4" />;
      case "mobile_pwa":
        return <Smartphone className="size-4" />;
      case "troubleshooting_faqs":
        return <HelpCircle className="size-4" />;
      case "architecture_cloud":
        return <Server className="size-4" />;
      case "environment_security":
        return <Key className="size-4" />;
      case "database_schema":
        return <Database className="size-4" />;
      case "cron_maintenance":
        return <RefreshCw className="size-4" />;
      case "disaster_recovery":
        return <ShieldAlert className="size-4" />;
      default:
        return <FileText className="size-4" />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header & Audience Segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <BookOpen className="size-4" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Knowledge Base & Manuals
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Search step-by-step operational guides, troubleshooting recipes, and technical handover docs.
          </p>
        </div>

        {/* Dual-Audience Switcher */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-muted/40 border border-border/50 flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => {
                setAudience("user");
                setSelectedCategory("all");
                setExpandedArticleId(null);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                audience === "user"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="size-3.5 text-primary" />
              <span>User Manual</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAudience("it");
                setSelectedCategory("all");
                setExpandedArticleId(null);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                audience === "it"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Server className="size-3.5 text-indigo-400" />
              <span>IT & Freelancer Guide</span>
            </button>
          </div>

          {/* Handover Kit Download Button */}
          <button
            type="button"
            onClick={handleDownloadHandoverKit}
            title="Download full offline Markdown documentation"
            className="h-9 px-3 rounded-xl neumorphic-extruded text-xs font-bold text-foreground hover:text-primary active:scale-95 transition-all flex items-center gap-1.5 border border-border/40 shrink-0"
          >
            <Download className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Handover Kit</span>
          </button>
        </div>
      </div>

      {/* Smart Search Bar & "Did You Mean?" Engine */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              audience === "user"
                ? "Search user manual (e.g., 'GCash QR', 'invoices', 'tenant invite', 'wifi flyer')..."
                : "Search IT docs (e.g., 'Supabase schema', 'env variables', 'RLS', 'keep-alive cron')..."
            }
            className="w-full h-11 pl-10 pr-10 rounded-xl neumorphic-inset bg-background/50 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-md hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* "Did you mean?" Typo Suggestion Chip */}
        {didYouMean && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Sparkles className="size-3.5 text-amber-500 animate-pulse shrink-0" />
            <span>Did you mean:</span>
            <button
              type="button"
              onClick={() => setSearchQuery(didYouMean)}
              className="font-bold text-primary hover:underline underline-offset-2 flex items-center gap-1"
            >
              <span>{didYouMean}</span>
              <ArrowRight className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar-premium">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0",
            selectedCategory === "all"
              ? "bg-primary text-white border-primary shadow-xs"
              : "neumorphic-extruded text-muted-foreground hover:text-foreground border-border/40"
          )}
        >
          All Topics
        </button>
        {availableCategories.map(([key, def]) => {
          const count = DOCS_ARTICLES.filter(
            (a) => a.audience === audience && a.category === key
          ).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0",
                selectedCategory === key
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "neumorphic-extruded text-muted-foreground hover:text-foreground border-border/40"
              )}
            >
              {getCategoryIcon(key)}
              <span>{def.label}</span>
              <span
                className={cn(
                  "size-4 rounded-full text-[9px] flex items-center justify-center font-black",
                  selectedCategory === key
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <strong className="text-foreground">{totalCount}</strong> articles
          {selectedCategory !== "all" && ` in ${CATEGORY_DEFINITIONS[selectedCategory]?.label}`}
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="text-primary hover:underline text-[11px] font-semibold"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Articles List / Interactive Accordion Cards */}
      {results.length === 0 ? (
        <div className="p-8 rounded-2xl neumorphic-panel border border-border/40 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-muted/30 text-muted-foreground flex items-center justify-center mx-auto">
            <HelpCircle className="size-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">No articles match your search</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Try checking for spelling or switch between the{" "}
            <strong>User Manual</strong> and <strong>IT Guide</strong> tabs above.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-xs"
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((article) => {
            const isExpanded = expandedArticleId === article.id;

            return (
              <motion.div
                key={article.id}
                layout
                className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isExpanded
                    ? "neumorphic-panel border-primary/40 shadow-lg bg-background/90"
                    : "neumorphic-extruded border-border/40 hover:border-border/80 bg-background/50"
                )}
              >
                {/* Article Header Card Summary */}
                <div
                  onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                  className="p-4 sm:p-5 cursor-pointer select-none flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs transition-colors",
                        isExpanded
                          ? "bg-primary text-white"
                          : "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {getCategoryIcon(article.category)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2 py-0.5 rounded-md bg-primary/10">
                          {article.categoryLabel}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {article.readTime}
                        </span>
                        {article.audience === "it" && (
                          <span
                            className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                              article.difficulty === "advanced"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-indigo-500/10 text-indigo-400"
                            )}
                          >
                            {article.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center transition-transform",
                        isExpanded
                          ? "rotate-180 bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <ChevronDown className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Expanded Interactive Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border/40 px-4 sm:px-6 py-5 bg-muted/10 space-y-5"
                    >
                      {/* Step-by-Step Instructions */}
                      {article.steps && article.steps.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Step-by-Step Guide
                          </h4>
                          <div className="space-y-3">
                            {article.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-xl bg-background/80 border border-border/50 space-y-2 shadow-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="size-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                                    {idx + 1}
                                  </div>
                                  <h5 className="text-xs font-bold text-foreground">
                                    {step.title}
                                  </h5>
                                </div>
                                <p className="text-xs text-muted-foreground pl-7 leading-relaxed">
                                  {step.description}
                                </p>

                                {/* Optional Code Snippet with 1-Click Copy */}
                                {step.codeSnippet && (
                                  <div className="ml-7 relative group rounded-lg bg-zinc-950 p-3 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                                    <pre className="overflow-x-auto custom-scrollbar-premium">
                                      <code>{step.codeSnippet}</code>
                                    </pre>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyCode(
                                          step.codeSnippet!,
                                          `${article.id}-step-${idx}`
                                        )
                                      }
                                      className="absolute right-2 top-2 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-sans flex items-center gap-1 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      {copiedCodeIndex === `${article.id}-step-${idx}` ? (
                                        <>
                                          <Check className="size-3 text-emerald-400" />
                                          <span className="text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="size-3" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}

                                {/* Pro Tip Callout */}
                                {step.tip && (
                                  <div className="ml-7 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-500 font-medium flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 shrink-0" />
                                    <span>{step.tip}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* IT Markdown Architecture Content */}
                      {article.contentMarkdown && (
                        <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800 text-zinc-300 text-xs font-mono overflow-x-auto custom-scrollbar-premium whitespace-pre">
                          {article.contentMarkdown.trim()}
                        </div>
                      )}

                      {/* Action Shortcuts & Deep Links */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
                        {/* Direct Action Deep Link */}
                        {article.actionShortcut && (
                          <div>
                            {article.actionShortcut.tabId && onNavigateTab ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateTab(article.actionShortcut!.tabId!)
                                }
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                              >
                                <span>{article.actionShortcut.label}</span>
                                <ExternalLink className="size-3" />
                              </button>
                            ) : article.actionShortcut.href ? (
                              <Link
                                href={article.actionShortcut.href}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                              >
                                <span>{article.actionShortcut.label}</span>
                                <ExternalLink className="size-3" />
                              </Link>
                            ) : null}
                          </div>
                        )}

                        {/* Related Problem Tags */}
                        {article.relatedArticleIds && article.relatedArticleIds.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Related Topics:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {article.relatedArticleIds.map((relId) => {
                                const relArt = DOCS_ARTICLES.find((a) => a.id === relId);
                                if (!relArt) return null;
                                return (
                                  <button
                                    key={relId}
                                    type="button"
                                    onClick={() => setExpandedArticleId(relId)}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold neumorphic-inset text-muted-foreground hover:text-foreground transition-all"
                                  >
                                    {relArt.title.split(":")[0]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
