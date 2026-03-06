export interface ArticleNode {
  id: string;
  title: string;
  summary: string;
  source: string;
  channel: "overseas" | "wechat-ai";
  score: number;
  dimensions: {
    novelty: number;
    depth: number;
    actionability: number;
    credibility: number;
    logic: number;
    timeliness: number;
    noise: number;
  };
  keywords: string[];
  link: string;
  pub_date: string;
  tier: number;
  topic_id: number | null;
  core_point?: string;
  highlights?: string[];
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  shared_keywords: string[];
}

export interface Topic {
  id: number;
  label: string;
  node_count: number;
  top_keywords: string[];
}

export interface GraphData {
  generated_at: string;
  window: { start: string; end: string };
  stats: {
    total_articles: number;
    total_sources: number;
    total_edges: number;
    total_topics: number;
    channels: Record<string, number>;
  };
  nodes: ArticleNode[];
  edges: Edge[];
  topics: Topic[];
}
