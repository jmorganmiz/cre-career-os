export type Firm = {
  id?: string; name: string; city?: string; state?: string; category?: string; priority?: string;
  website_url?: string; careers_url?: string; why_interested?: string; notes?: string; ai_summary?: string;
};

export type Contact = {
  id?: string; firm_id?: string; first_name: string; last_name: string; title?: string; linkedin_url?: string;
  email?: string; status?: string; follow_up_at?: string; relationship_score?: number; notes?: string;
};

export type Application = {
  id?: string; firm_id?: string; role_title: string; city?: string; job_url?: string; status?: string;
  date_applied?: string; referral_contact_id?: string; interview_stage?: string; follow_up_at?: string; notes?: string;
};

export type OpportunityRun = {
  id?: string;
  input: Record<string, string>;
  output: {
    search_summary?: string;
    strategy?: string[];
    opportunities?: {
      firm_name?: string;
      role_title?: string;
      fit_score?: number;
      timing_score?: number;
      source_quality_score?: number;
      career_fit_score?: number;
      opportunity_type?: string;
      source_url?: string;
    }[];
    searches_to_run_next?: string[];
    demo?: boolean;
    agent_error?: string;
  };
  created_at?: string;
};

export type AutomationSettings = {
  user_id?: string;
  enabled: boolean;
  monthly_limit_usd: number;
  run_reserve_usd: number;
  last_run_at?: string;
  updated_at?: string;
};

export type AutomationRun = {
  id?: string;
  run_key: string;
  status: "running" | "completed" | "failed" | "skipped";
  reserved_cost_usd: number;
  estimated_cost_usd: number;
  input_tokens?: number;
  output_tokens?: number;
  web_search_calls?: number;
  opportunity_count?: number;
  error?: string;
  created_at?: string;
  completed_at?: string;
};
export type ResearchRun = {
  id?: string;
  firm_id?: string;
  input: Record<string, string>;
  output: {
    firm_summary?: string;
    fit?: string;
    questions?: string[];
    linkedin_message?: string;
    talking_points?: string[];
    red_flags?: string[];
    sources?: { title: string; url: string }[];
    demo?: boolean;
    agent_error?: string;
  };
  created_at?: string;
};

export type ActivityLog = {
  id?: string;
  action_id: string;
  action_type?: string;
  title?: string;
  completed_at?: string;
};

export type Notice = {
  tone: "success" | "error";
  message: string;
};
