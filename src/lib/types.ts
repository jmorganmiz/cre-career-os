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
