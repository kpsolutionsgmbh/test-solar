export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  company_name: string;
  company_logo_url: string | null;
  brand_color: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  admin_id: string;
  name: string;
  position: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Dealroom {
  id: string;
  admin_id: string;
  slug: string;
  status: 'draft' | 'published' | 'signed' | 'inactive' | 'archived';
  client_name: string;
  client_company: string;
  client_position: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  client_logo_url: string | null;
  video_url: string | null;
  pandadoc_embed_url: string | null;
  ai_input_text: string | null;
  ai_input_audio_url: string | null;
  generated_content: DealroomContent | null;
  custom_content: DealroomContent | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  language: 'de' | 'en';
  assigned_member_id: string | null;
  customer_id: string | null;
  engagement_score: number;
  email_unsubscribed: boolean;
}

export interface Customer {
  id: string;
  admin_id: string;
  salutation: 'Herr' | 'Frau';
  first_name: string;
  last_name: string;
  company: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  notes: string | null;
  assigned_member_id: string | null;
  created_at: string;
  updated_at: string;
}

export type VisualType = 'counter_down' | 'counter_up' | 'rising_number' | 'comparison_bar' | 'percentage_ring' | 'simple_icon';

export interface VisualData {
  from?: number;
  to?: number;
  value?: number;
  you?: number;
  competitor?: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  color?: string;
}

export interface DealroomContent {
  hero_title: string;
  hero_subtitle: string;
  situation_points: Array<{
    icon: string;
    text: string;
    emoji?: string;
    heading?: string;
    subtext?: string;
    visual_type?: VisualType;
    visual_data?: VisualData;
  }>;
  goal: string;
  approach: string;
  cost_of_inaction: {
    headline: string;
    consequences: Array<{
      icon: string;
      text: string;
      emoji?: string;
      heading?: string;
      subtext?: string;
    }>;
  };
  outcome_vision: Array<string | { text: string; detail?: string; visual_type?: VisualType; visual_data?: VisualData }>;
  outcome_quote?: string;
  process_steps: Array<{
    step: number;
    title: string;
    duration: string;
    effort: string;
    description: string;
    customer_action?: string;
  }>;
  concrete_benefits?: Array<{
    value: string;
    label: string;
    detail?: string;
  }>;
  guarantee_title?: string;
  guarantee_text?: string;
  cta_text: string;
  cta_derisking?: string;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface TrackingEvent {
  id: string;
  dealroom_id: string;
  event_type: TrackingEventType;
  event_data: Record<string, unknown> | null;
  visitor_ip: string | null;
  user_agent: string | null;
  session_id: string;
  created_at: string;
}

export type TrackingEventType =
  | 'page_view'
  | 'tab_switch'
  | 'video_play'
  | 'video_complete'
  | 'pandadoc_open'
  | 'pandadoc_sign'
  | 'scroll_depth'
  | 'cta_click'
  | 'session_end'
  | 'document_download'
  | 'email_sent';

export type EmailFlowTriggerType =
  | 'manual'
  | 'not_opened'
  | 'opened_not_offer'
  | 'offer_not_signed'
  | 'inactive';

export type EmailFlowLogStatus = 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'skipped';

export interface EmailFlow {
  id: string;
  admin_id: string;
  name: string;
  description: string | null;
  trigger_type: EmailFlowTriggerType;
  trigger_days: number;
  subject_template: string;
  body_template: string;
  is_active: boolean;
  max_sends: number;
  skip_weekends: boolean;
  skip_if_signed: boolean;
  skip_if_inactive: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailFlowLog {
  id: string;
  flow_id: string;
  dealroom_id: string;
  recipient_email: string;
  subject: string;
  status: EmailFlowLogStatus;
  skip_reason: string | null;
  sent_at: string;
}

export interface Reference {
  id: string;
  admin_id: string;
  client_name: string;
  client_company: string;
  quote: string | null;
  logo_url: string | null;
  result_summary: string | null;
  situation_text: string | null;
  method_text: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  video_url: string | null;
  image_url: string | null;
}
