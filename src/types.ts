// Research Synthesis Agent Types

export interface ResearchSource {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: 'journal' | 'book' | 'conference' | 'website' | 'other';
  url?: string;
  relevance: string;
  keyFindings: string[];
  credibilityScore: number;
  addedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  type: 'user' | 'agent' | 'system';
  metadata?: {
    sourceId?: string;
    action?: string;
  };
}

export interface ResearchProject {
  id: string;
  question: string;
  description: string;
  sources: ResearchSource[];
  synthesis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  totalSources: number;
  sourcesByType: Record<string, number>;
  averageCredibility: number;
  recentActivity: number;
}
