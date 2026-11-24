# lib/moderation
Moderation pipeline. Each check returns `{ decision: 'allow' | 'review' | 'block', reason }` (T1.6, MVP 5).