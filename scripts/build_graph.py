#!/usr/bin/env python3
"""
Signal Atlas Data Pipeline
Transforms briefing cache JSON into graph.json for the star field visualization.

Usage:
    cd signal-atlas && ../briefing/venv/bin/python3 scripts/build_graph.py
"""

import json
import re
import sys
import math
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timedelta

# jieba for Chinese keyword extraction
import jieba.analyse

# ============== CONFIG ==============

BRIEFING_CACHE = Path(__file__).parent.parent.parent / "briefing" / "cache"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"
CHANNELS = ["overseas", "wechat-ai"]
WINDOW_DAYS = 7           # Articles from last N days for main graph
TREND_DAYS = 30           # Historical window for trends
MIN_SCORE = 20            # Skip noise articles
EDGE_THRESHOLD = 2        # Min shared keywords to create an edge (for strong edges)
WEAK_EDGE_THRESHOLD = 1   # Min shared keywords for weak edges (lighter visual)
CLUSTER_MIN_SIZE = 3      # Min articles to form a topic cluster
KEYWORD_TOP_K = 8         # Keywords per article
MAX_KEYWORD_FREQ = 0.12   # Skip keywords appearing in >12% of articles (too generic)
# Domain stopwords: too common in an AI-focused dataset to be discriminating
AI_DOMAIN_STOPWORDS = {
    "ai", "model", "技术", "平台", "公司", "企业", "行业", "发展",
    "能力", "用户", "功能", "工具", "tool", "tools", "api",
    "new", "feature", "features", "可以", "使用", "支持",
    "release", "update", "version", "performance", "能够",
}

# ============== BILINGUAL SYNONYM MAP ==============
# Maps various forms → canonical term (for cross-language clustering)

SYNONYM_MAP = {
    # Agent
    "agent": "agent", "agents": "agent", "智能体": "agent", "ai agent": "agent",
    "agentic": "agent", "multi-agent": "agent", "多智能体": "agent",
    # RAG
    "rag": "rag", "retrieval": "rag", "检索增强": "rag", "检索": "rag",
    "retrieval-augmented": "rag",
    # Reasoning
    "reasoning": "reasoning", "推理": "reasoning", "chain-of-thought": "reasoning",
    "cot": "reasoning", "思维链": "reasoning", "o1": "reasoning", "o3": "reasoning",
    # Coding
    "coding": "coding", "code": "coding", "编程": "coding", "代码": "coding",
    "copilot": "coding", "cursor": "coding", "编码": "coding",
    # Model
    "model": "model", "模型": "model", "大模型": "model", "llm": "model",
    "language model": "model", "大语言模型": "model", "基座模型": "model",
    # Open Source
    "open-source": "open_source", "open source": "open_source", "开源": "open_source",
    "opensource": "open_source",
    # Fine-tuning
    "fine-tuning": "fine_tuning", "fine tuning": "fine_tuning", "微调": "fine_tuning",
    "finetuning": "fine_tuning", "sft": "fine_tuning",
    # Multimodal
    "multimodal": "multimodal", "多模态": "multimodal", "vision": "multimodal",
    "视觉": "multimodal", "图像": "multimodal", "image": "multimodal",
    # Prompt
    "prompt": "prompt", "提示词": "prompt", "prompt engineering": "prompt",
    "提示工程": "prompt",
    # Benchmark / Eval
    "benchmark": "evaluation", "eval": "evaluation", "评测": "evaluation",
    "评估": "evaluation", "leaderboard": "evaluation",
    # MCP / Tool Use
    "mcp": "tool_use", "tool use": "tool_use", "function calling": "tool_use",
    "工具调用": "tool_use", "工具使用": "tool_use",
    # Training / Infra
    "training": "training", "训练": "training", "预训练": "training",
    "pre-training": "training",
    # Deployment / Inference
    "inference": "inference", "部署": "inference", "推理优化": "inference",
    "vllm": "inference", "trt-llm": "inference", "量化": "inference",
    "quantization": "inference",
    # Safety / Alignment
    "safety": "safety", "alignment": "safety", "安全": "safety", "对齐": "safety",
    "rlhf": "safety",
    # Data
    "data": "data", "数据": "data", "dataset": "data", "数据集": "data",
    "synthetic data": "data", "合成数据": "data",
    # Application
    "application": "application", "应用": "application", "落地": "application",
    "产品": "application", "product": "application",
    # Claude / Anthropic
    "claude": "claude", "anthropic": "claude",
    # GPT / OpenAI
    "gpt": "gpt", "openai": "gpt", "chatgpt": "gpt",
    # Google
    "gemini": "gemini", "google": "gemini", "deepmind": "gemini",
    # Meta
    "llama": "llama", "meta ai": "llama",
    # DeepSeek
    "deepseek": "deepseek", "深度求索": "deepseek",
    # Diffusion / Image Gen
    "diffusion": "image_gen", "stable diffusion": "image_gen",
    "midjourney": "image_gen", "文生图": "image_gen", "图像生成": "image_gen",
    "sora": "video_gen", "视频生成": "video_gen", "文生视频": "video_gen",
    # Search
    "search": "search", "搜索": "search",
    # Robotics
    "robotics": "robotics", "机器人": "robotics", "具身智能": "robotics",
    "embodied": "robotics",
    # Workflow / Automation
    "workflow": "workflow", "工作流": "workflow", "automation": "workflow",
    "自动化": "workflow",
}

# English stopwords for keyword extraction
ENGLISH_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for",
    "of", "and", "or", "with", "this", "that", "it", "its", "from", "by", "as",
    "be", "been", "being", "have", "has", "had", "will", "can", "could", "would",
    "should", "may", "might", "do", "does", "did", "not", "no", "but", "if",
    "about", "more", "than", "when", "how", "what", "which", "who", "their",
    "they", "them", "we", "our", "you", "your", "all", "new", "one", "two",
    "also", "just", "into", "over", "after", "before", "between", "through",
    "during", "without", "within", "using", "use", "used", "like", "get",
    "make", "way", "things", "some", "other", "most", "many", "much", "very",
    "even", "still", "now", "here", "there", "where", "why", "each", "every",
    "both", "few", "such", "only", "own", "same", "so", "too", "up", "down",
    "out", "off", "then", "once", "any", "these", "those", "first", "last",
    "next", "well", "back", "good", "great", "long", "right", "while",
    "since", "come", "made", "take", "see", "need", "want", "look", "think",
    "say", "said", "tell", "told", "ask", "try", "keep", "let", "help",
    "show", "turn", "move", "live", "real", "part", "could", "work", "world",
    "year", "day", "time", "people", "going", "know", "really", "actually",
    "already", "something", "nothing", "everything", "anyone", "someone",
    "today", "article", "blog", "post", "read", "write", "written",
    "set", "system", "process", "point", "number", "end", "case", "place",
    "run", "build", "start", "create", "develop", "release", "support",
    "update", "launch", "available", "introduce", "announce", "enable",
    "different", "specific", "include", "provide", "allow", "based",
    "key", "high", "low", "full", "large", "small", "better", "best",
}

# ============== KEYWORD EXTRACTION ==============

def normalize_keyword(word: str):
    """Map a word to its canonical form via synonym map, or return lowercase."""
    w = word.lower().strip()
    if w in AI_DOMAIN_STOPWORDS:
        return None
    if w in SYNONYM_MAP:
        return SYNONYM_MAP[w]
    if len(w) < 2:
        return None
    # Also filter the canonical form against domain stopwords
    canonical = SYNONYM_MAP.get(w, w)
    if canonical in AI_DOMAIN_STOPWORDS:
        return None
    return canonical


def extract_keywords_chinese(text: str) -> list[str]:
    """Extract keywords from Chinese text using jieba TF-IDF."""
    if not text.strip():
        return []
    raw = jieba.analyse.extract_tags(text, topK=KEYWORD_TOP_K * 2, withWeight=False)
    keywords = []
    seen = set()
    for w in raw:
        canonical = normalize_keyword(w)
        if canonical and canonical not in seen and len(canonical) >= 2:
            seen.add(canonical)
            keywords.append(canonical)
        if len(keywords) >= KEYWORD_TOP_K:
            break
    return keywords


def extract_keywords_english(text: str) -> list[str]:
    """Extract keywords from English text using simple TF + compound detection."""
    if not text.strip():
        return []
    text_lower = text.lower()

    keywords = []
    seen = set()

    # 1. Check compound terms from synonym map (multi-word)
    for phrase, canonical in SYNONYM_MAP.items():
        if " " in phrase or "-" in phrase:
            if phrase in text_lower and canonical not in seen:
                seen.add(canonical)
                keywords.append(canonical)

    # 2. Single word extraction
    words = re.findall(r'[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]|[a-zA-Z]', text_lower)
    word_counts = Counter(w for w in words if w not in ENGLISH_STOPWORDS and len(w) >= 3)

    for word, _ in word_counts.most_common(KEYWORD_TOP_K * 2):
        canonical = normalize_keyword(word)
        if canonical and canonical not in seen:
            seen.add(canonical)
            keywords.append(canonical)
        if len(keywords) >= KEYWORD_TOP_K:
            break

    return keywords


def extract_keywords(article: dict, channel: str) -> list[str]:
    """Extract keywords from an article based on channel language."""
    parts = [article.get("title", "")]
    if article.get("summary"):
        parts.append(article["summary"])
    if article.get("core_point"):
        parts.append(article["core_point"])
    if article.get("highlights"):
        parts.extend(article["highlights"])
    text = " ".join(str(p) for p in parts)

    if channel == "overseas":
        return extract_keywords_english(text)
    else:
        return extract_keywords_chinese(text)


# ============== DATA LOADING ==============

def load_articles(window_days: int) -> list[dict]:
    """Load articles from briefing cache for the last N days."""
    today = datetime.now().date()
    articles = []
    seen_fps = set()

    for channel in CHANNELS:
        cache_dir = BRIEFING_CACHE / channel
        if not cache_dir.exists():
            print(f"WARNING: Cache dir not found: {cache_dir}", file=sys.stderr)
            continue

        for d in range(window_days):
            date = today - timedelta(days=d)
            date_str = date.strftime("%Y-%m-%d")
            fpath = cache_dir / f"briefing_data_{date_str}.json"
            if not fpath.exists():
                continue

            try:
                with open(fpath, encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                print(f"WARNING: Failed to load {fpath}: {e}", file=sys.stderr)
                continue

            for tier_key in ["tier1", "tier2", "tier3"]:
                for art in data.get(tier_key, []):
                    # Skip rejected / low score / duplicates
                    if art.get("rejected"):
                        continue
                    score = art.get("score") or art.get("total") or 0
                    if score < MIN_SCORE:
                        continue
                    fp = art.get("fingerprint", "")
                    if fp in seen_fps:
                        continue
                    seen_fps.add(fp)

                    keywords = extract_keywords(art, channel)

                    articles.append({
                        "id": fp,
                        "title": art.get("title", ""),
                        "summary": art.get("summary", ""),
                        "source": art.get("source", ""),
                        "channel": channel,
                        "score": score,
                        "dimensions": {
                            "novelty": art.get("novelty", 0),
                            "depth": art.get("depth", 0),
                            "actionability": art.get("actionability", 0),
                            "credibility": art.get("credibility", 0),
                            "logic": art.get("logic", 0),
                            "timeliness": art.get("timeliness", 0),
                            "noise": art.get("noise", 0),
                        },
                        "keywords": keywords,
                        "link": art.get("link", ""),
                        "pub_date": art.get("pub_date", date_str),
                        "tier": art.get("tier", 2),
                        "core_point": art.get("core_point", ""),
                        "highlights": art.get("highlights", []),
                    })

    return articles


# ============== GRAPH CONSTRUCTION ==============

def compute_edges(articles: list[dict]) -> list[dict]:
    """Compute edges between articles that share enough keywords."""
    # Build keyword → article index
    kw_index = defaultdict(set)
    for i, art in enumerate(articles):
        for kw in art["keywords"]:
            kw_index[kw].add(i)

    # Find pairs with shared keywords
    pair_shared = defaultdict(set)
    for kw, indices in kw_index.items():
        idx_list = list(indices)
        for a in range(len(idx_list)):
            for b in range(a + 1, len(idx_list)):
                pair = (min(idx_list[a], idx_list[b]), max(idx_list[a], idx_list[b]))
                pair_shared[pair].add(kw)

    edges = []
    for (i, j), shared in pair_shared.items():
        if len(shared) >= EDGE_THRESHOLD:
            edges.append({
                "source": articles[i]["id"],
                "target": articles[j]["id"],
                "weight": len(shared),
                "shared_keywords": sorted(shared),
            })

    return edges


def find_topic_clusters(articles: list[dict], edges: list[dict]) -> list[dict]:
    """Find connected components as topic clusters."""
    id_to_idx = {a["id"]: i for i, a in enumerate(articles)}

    # Build adjacency
    adj = defaultdict(set)
    for e in edges:
        si = id_to_idx.get(e["source"])
        ti = id_to_idx.get(e["target"])
        if si is not None and ti is not None:
            adj[si].add(ti)
            adj[ti].add(si)

    # BFS to find components
    visited = set()
    clusters = []

    for idx in range(len(articles)):
        if idx in visited:
            continue
        queue = [idx]
        component = []
        while queue:
            n = queue.pop(0)
            if n in visited:
                continue
            visited.add(n)
            component.append(n)
            queue.extend(adj[n] - visited)

        if len(component) >= CLUSTER_MIN_SIZE:
            clusters.append(component)

    # Label clusters by most frequent keyword
    topics = []
    for tid, component in enumerate(clusters):
        kw_counts = Counter()
        for idx in component:
            kw_counts.update(articles[idx]["keywords"])
        top_kws = [kw for kw, _ in kw_counts.most_common(5)]
        label = top_kws[0] if top_kws else f"topic_{tid}"

        # Mark articles with topic_id
        for idx in component:
            articles[idx]["topic_id"] = tid

        topics.append({
            "id": tid,
            "label": label,
            "node_count": len(component),
            "top_keywords": top_kws,
        })

    # Mark isolated articles
    for art in articles:
        if "topic_id" not in art:
            art["topic_id"] = None

    return topics


# ============== SOURCES SUMMARY ==============

def build_sources_summary(all_articles: list[dict]) -> list[dict]:
    """Aggregate source-level statistics."""
    source_data = defaultdict(lambda: {
        "articles": [], "scores": [], "keywords": Counter()
    })

    for art in all_articles:
        key = art["source"]
        source_data[key]["articles"].append(art)
        source_data[key]["scores"].append(art["score"])
        source_data[key]["keywords"].update(art["keywords"])
        source_data[key]["channel"] = art["channel"]

    summaries = []
    for name, data in source_data.items():
        scores = data["scores"]
        summaries.append({
            "name": name,
            "channel": data["channel"],
            "total_articles": len(scores),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "max_score": max(scores) if scores else 0,
            "tier1_count": sum(1 for a in data["articles"] if a["tier"] == 1),
            "top_keywords": [kw for kw, _ in data["keywords"].most_common(5)],
        })

    summaries.sort(key=lambda x: x["avg_score"], reverse=True)
    return summaries


# ============== TRENDS ==============

def build_trends(trend_days: int) -> dict:
    """Build daily keyword frequency for trend charts."""
    today = datetime.now().date()
    dates = []
    daily_keywords = defaultdict(lambda: Counter())

    for d in range(trend_days):
        date = today - timedelta(days=d)
        date_str = date.strftime("%Y-%m-%d")
        dates.append(date_str)

        for channel in CHANNELS:
            fpath = BRIEFING_CACHE / channel / f"briefing_data_{date_str}.json"
            if not fpath.exists():
                continue
            try:
                with open(fpath, encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                continue

            for tier_key in ["tier1", "tier2", "tier3"]:
                for art in data.get(tier_key, []):
                    if art.get("rejected"):
                        continue
                    score = art.get("score") or art.get("total") or 0
                    if score < MIN_SCORE:
                        continue
                    keywords = extract_keywords(art, channel)
                    daily_keywords[date_str].update(keywords)

    # Find top keywords across all days
    total_kw = Counter()
    for day_counts in daily_keywords.values():
        total_kw.update(day_counts)
    top_keywords = [kw for kw, _ in total_kw.most_common(15)]

    # Build time series
    dates.sort()
    topics = {}
    for kw in top_keywords:
        topics[kw] = [daily_keywords[d].get(kw, 0) for d in dates]

    return {"dates": dates, "topics": topics}


# ============== MAIN ==============

def main():
    print("=== Signal Atlas Data Pipeline ===")

    # 1. Load articles (7-day window for graph)
    print(f"\n[1/5] Loading articles (last {WINDOW_DAYS} days)...")
    articles = load_articles(WINDOW_DAYS)
    print(f"  Loaded {len(articles)} articles")
    ch_counts = Counter(a["channel"] for a in articles)
    for ch, cnt in ch_counts.items():
        print(f"    {ch}: {cnt}")

    if not articles:
        print("ERROR: No articles found!", file=sys.stderr)
        sys.exit(1)

    # Keyword stats
    kw_counts = [len(a["keywords"]) for a in articles]
    avg_kw = sum(kw_counts) / len(kw_counts) if kw_counts else 0
    print(f"  Avg keywords per article: {avg_kw:.1f}")

    # 1.5. Filter overly common keywords
    print(f"\n[1.5] Filtering generic keywords (>{MAX_KEYWORD_FREQ*100:.0f}% frequency)...")
    kw_doc_freq = Counter()
    for a in articles:
        kw_doc_freq.update(set(a["keywords"]))
    max_count = int(len(articles) * MAX_KEYWORD_FREQ)
    generic_kws = {kw for kw, cnt in kw_doc_freq.items() if cnt > max_count}
    if generic_kws:
        print(f"  Removing {len(generic_kws)} generic keywords: {', '.join(sorted(generic_kws))}")
        for a in articles:
            a["keywords"] = [kw for kw in a["keywords"] if kw not in generic_kws]

    # 2. Compute edges
    print(f"\n[2/5] Computing edges (threshold={EDGE_THRESHOLD} shared keywords)...")
    edges = compute_edges(articles)
    print(f"  Found {len(edges)} edges")

    # 3. Find topic clusters
    print(f"\n[3/5] Finding topic clusters (min size={CLUSTER_MIN_SIZE})...")
    topics = find_topic_clusters(articles, edges)
    print(f"  Found {len(topics)} topics:")
    for t in topics:
        print(f"    [{t['label']}] {t['node_count']} articles — {', '.join(t['top_keywords'][:3])}")

    isolated = sum(1 for a in articles if a.get("topic_id") is None)
    print(f"  Isolated articles: {isolated}")

    # 4. Build sources summary (using all loaded articles)
    print(f"\n[4/5] Building source summaries...")
    all_articles_30d = load_articles(TREND_DAYS)
    sources = build_sources_summary(all_articles_30d)
    print(f"  {len(sources)} unique sources")

    # 5. Build trends
    print(f"\n[5/5] Building trends (last {TREND_DAYS} days)...")
    trends = build_trends(TREND_DAYS)
    print(f"  {len(trends['dates'])} days, {len(trends['topics'])} top keywords")

    # Write outputs
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    graph_data = {
        "generated_at": datetime.now().isoformat(),
        "window": {
            "start": (datetime.now().date() - timedelta(days=WINDOW_DAYS)).isoformat(),
            "end": datetime.now().date().isoformat(),
        },
        "stats": {
            "total_articles": len(articles),
            "total_sources": len(set(a["source"] for a in articles)),
            "total_edges": len(edges),
            "total_topics": len(topics),
            "channels": dict(ch_counts),
        },
        "nodes": articles,
        "edges": edges,
        "topics": topics,
    }

    graph_path = OUTPUT_DIR / "graph.json"
    with open(graph_path, "w", encoding="utf-8") as f:
        json.dump(graph_data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n  Wrote {graph_path} ({graph_path.stat().st_size // 1024} KB)")

    sources_path = OUTPUT_DIR / "sources.json"
    with open(sources_path, "w", encoding="utf-8") as f:
        json.dump(sources, f, ensure_ascii=False, indent=2)
    print(f"  Wrote {sources_path}")

    trends_path = OUTPUT_DIR / "trends.json"
    with open(trends_path, "w", encoding="utf-8") as f:
        json.dump(trends, f, ensure_ascii=False, indent=2)
    print(f"  Wrote {trends_path}")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
