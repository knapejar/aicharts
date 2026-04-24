const KNOWN_AGENT_UAS = [
  'GPTBot',
  'ChatGPT-User',
  'ChatGPT',
  'OAI-SearchBot',
  'OpenAI',
  'ClaudeBot',
  'Claude-Web',
  'claude-user',
  'claude-searchbot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'GoogleOther',
  'Bytespider',
  'CCBot',
  'Amazonbot',
  'DuckAssistBot',
  'YouBot',
  'Applebot-Extended',
  'cohere-ai',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'MistralAI-User',
];

const UA_REGEX = new RegExp(KNOWN_AGENT_UAS.map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'i');

export type AgentDetection = {
  isAgent: boolean;
  reason: 'user-agent' | 'query-param' | 'none';
  label: string | null;
};

export function detectAgent(userAgent: string | undefined | null, urlQuery?: string): AgentDetection {
  if (urlQuery) {
    const qp = urlQuery.toLowerCase();
    if (/(^|[&?])as=agent(&|$)/.test(qp) || /(^|[&?])format=llm(&|$)/.test(qp)) {
      return { isAgent: true, reason: 'query-param', label: 'query-param' };
    }
    if (/(^|[&?])as=human(&|$)/.test(qp)) {
      return { isAgent: false, reason: 'none', label: null };
    }
  }
  const ua = userAgent ?? '';
  const match = ua.match(UA_REGEX);
  if (match) {
    return { isAgent: true, reason: 'user-agent', label: match[0] };
  }
  return { isAgent: false, reason: 'none', label: null };
}

export const KNOWN_AGENT_LIST = KNOWN_AGENT_UAS;
