export const CHANNEL_COLORS: Record<string, string> = {
  overseas: "#4fc3f7",
  "wechat-ai": "#ab47bc",
};

export const CHANNEL_HEX: Record<string, number> = {
  overseas: 0x4fc3f7,
  "wechat-ai": 0xab47bc,
};

export const CHANNEL_LABELS: Record<string, string> = {
  overseas: "Overseas",
  "wechat-ai": "WeChat AI",
};

export function scoreToSize(score: number): number {
  return 0.5 + ((score - 20) / 80) * 2.5;
}

export function scoreToBrightness(score: number): number {
  return 0.4 + ((score - 20) / 80) * 0.6;
}
