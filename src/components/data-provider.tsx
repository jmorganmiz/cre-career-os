"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ActivityLog, Application, Contact, Firm, Notice, OpportunityRun, ResearchRun } from "@/lib/types";

type Resource = "firms" | "contacts" | "applications";
type RecordMap = { firms: Firm; contacts: Contact; applications: Application };
type SyncStatus = "checking" | "active" | "error";
type DataContextValue = {
  firms: Firm[]; contacts: Contact[]; applications: Application[]; opportunityRuns: OpportunityRun[]; researchRuns: ResearchRun[]; activityLog: ActivityLog[]; user: null; live: boolean; syncStatus: SyncStatus; notice: Notice | null;
  add: <K extends Resource>(resource: K, value: RecordMap[K]) => Promise<RecordMap[K]>;
  update: <K extends Resource>(resource: K, id: string, value: Partial<RecordMap[K]>) => Promise<RecordMap[K]>;
  remove: (resource: Resource, id?: string) => Promise<void>;
  importMany: <K extends Resource>(resource: K, items: RecordMap[K][]) => Promise<void>;
  addOpportunityRun: (input: OpportunityRun["input"], output: OpportunityRun["output"]) => Promise<OpportunityRun>;
  addResearchRun: (input: ResearchRun["input"], output: ResearchRun["output"], firmId?: string) => Promise<ResearchRun>;
  completeAction: (action: Omit<ActivityLog, "id" | "completed_at">) => Promise<void>;
  clearNotice: () => void;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const demoFirms: Firm[] = [
  { id: "demo-1", name: "Greystar", city: "Charleston", state: "SC", category: "Multifamily", priority: "Tier 1", why_interested: "Global platform with deep operating exposure" },
  { id: "demo-2", name: "Walker & Dunlop", city: "Bethesda", state: "MD", category: "Lending", priority: "Tier 1", why_interested: "Tech-forward capital markets platform" },
  { id: "demo-3", name: "VTS", city: "New York", state: "NY", category: "PropTech", priority: "Tier 1", why_interested: "Data and workflow infrastructure for CRE" },
];
const demoContacts: Contact[] = [
  { id: "demo-c1", firm_id: "demo-1", first_name: "Maya", last_name: "Reynolds", title: "Senior Associate, Investments", status: "Warm", relationship_score: 82 },
  { id: "demo-c2", firm_id: "demo-2", first_name: "Daniel", last_name: "Kim", title: "Director, Capital Markets", status: "Connected", relationship_score: 76 },
];
const demoApplications: Application[] = [
  { id: "demo-a1", firm_id: "demo-1", role_title: "Analyst, Multifamily Investments", city: "Atlanta, GA", status: "Interviewing", interview_stage: "First round", date_applied: "2026-06-04" },
  { id: "demo-a2", firm_id: "demo-2", role_title: "Capital Markets Analyst", city: "Bethesda, MD", status: "Applied", interview_stage: "Application review", date_applied: "2026-06-08" },
];

const DataContext = createContext<DataContextValue | null>(null);

async function postData(body: Record<string, unknown>) {
  const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Data sync failed.");
  return data;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [firms, setFirms] = useState<Firm[]>(demoFirms);
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [applications, setApplications] = useState<Application[]>(demoApplications);
  const [opportunityRuns, setOpportunityRuns] = useState<OpportunityRun[]>([]);
  const [researchRuns, setResearchRuns] = useState<ResearchRun[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [live, setLive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("checking");

  const showNotice = (message: string, tone: Notice["tone"] = "success") => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 4500);
  };

  useEffect(() => {
    fetch("/api/data", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.configured) throw new Error(data.error || "Automatic Supabase sync is not configured.");
      setFirms(data.firms || []);
      setContacts(data.contacts || []);
      setApplications(data.applications || []);
      setOpportunityRuns(data.opportunityRuns || []);
      setResearchRuns(data.researchRuns || []);
      setActivityLog(data.activityLog || []);
      setLive(true);
      setSyncStatus("active");
    }).catch((error) => {
      setLive(false);
      setSyncStatus("error");
      showNotice(`${error.message} Using demo/local data.`, "error");
    });
  }, []);

  const add: DataContextValue["add"] = async (resource, value) => {
    try {
      const { data, duplicate } = await postData({ action: "add", resource, value });
      if (resource === "firms") setFirms((x) => duplicate || x.some((item) => item.id === data.id) ? x : [data as Firm, ...x]);
      if (resource === "contacts") setContacts((x) => duplicate || x.some((item) => item.id === data.id) ? x : [data as Contact, ...x]);
      if (resource === "applications") setApplications((x) => duplicate || x.some((item) => item.id === data.id) ? x : [data as Application, ...x]);
      showNotice(duplicate ? "Already saved. Existing record kept." : "Saved to Supabase.");
      return data as RecordMap[typeof resource];
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Save failed.", "error");
      if (syncStatus !== "error") throw error;
      const item = { ...value, id: crypto.randomUUID() };
      if (resource === "firms") setFirms((x) => [item as Firm, ...x]);
      if (resource === "contacts") setContacts((x) => [item as Contact, ...x]);
      if (resource === "applications") setApplications((x) => [item as Application, ...x]);
      return item as RecordMap[typeof resource];
    }
  };

  const update: DataContextValue["update"] = async (resource, id, value) => {
    try {
      const { data } = await postData({ action: "update", resource, id, value });
      if (resource === "firms") setFirms((x) => x.map((item) => item.id === id ? data as Firm : item));
      if (resource === "contacts") setContacts((x) => x.map((item) => item.id === id ? data as Contact : item));
      if (resource === "applications") setApplications((x) => x.map((item) => item.id === id ? data as Application : item));
      showNotice("Changes saved.");
      return data as RecordMap[typeof resource];
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Updated locally only.", "error");
      const local = { ...value, id };
      if (resource === "firms") setFirms((x) => x.map((item) => item.id === id ? { ...item, ...local } as Firm : item));
      if (resource === "contacts") setContacts((x) => x.map((item) => item.id === id ? { ...item, ...local } as Contact : item));
      if (resource === "applications") setApplications((x) => x.map((item) => item.id === id ? { ...item, ...local } as Application : item));
      return local as RecordMap[typeof resource];
    }
  };

  const remove = async (resource: Resource, id?: string) => {
    if (!id) return;
    try { await postData({ action: "remove", resource, id }); showNotice("Record deleted."); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Deleted locally only.", "error"); }
    if (resource === "firms") setFirms((x) => x.filter((v) => v.id !== id));
    if (resource === "contacts") setContacts((x) => x.filter((v) => v.id !== id));
    if (resource === "applications") setApplications((x) => x.filter((v) => v.id !== id));
  };

  const importMany: DataContextValue["importMany"] = async (resource, items) => {
    try {
      const { data } = await postData({ action: "importMany", resource, items });
      if (resource === "firms") setFirms((x) => [...(data as Firm[]), ...x]);
      if (resource === "contacts") setContacts((x) => [...(data as Contact[]), ...x]);
      if (resource === "applications") setApplications((x) => [...(data as Application[]), ...x]);
      showNotice(`${items.length} records imported.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Imported locally only.", "error");
      const local = items.map((v) => ({ ...v, id: crypto.randomUUID() }));
      if (resource === "firms") setFirms((x) => [...(local as unknown as Firm[]), ...x]);
      if (resource === "contacts") setContacts((x) => [...(local as unknown as Contact[]), ...x]);
      if (resource === "applications") setApplications((x) => [...(local as unknown as Application[]), ...x]);
    }
  };

  const addOpportunityRun: DataContextValue["addOpportunityRun"] = async (input, output) => {
    try {
      const { data } = await postData({ action: "opportunityRun", input, output });
      setOpportunityRuns((current) => [data as OpportunityRun, ...current].slice(0, 12));
      return data as OpportunityRun;
    } catch {
      const run: OpportunityRun = { id: crypto.randomUUID(), input, output, created_at: new Date().toISOString() };
      setOpportunityRuns((current) => [run, ...current].slice(0, 12));
      return run;
    }
  };

  const addResearchRun: DataContextValue["addResearchRun"] = async (input, output, firmId) => {
    try {
      const { data } = await postData({ action: "researchRun", input, output, firmId });
      setResearchRuns((current) => [data as ResearchRun, ...current].slice(0, 12));
      return data as ResearchRun;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Research history saved locally only.", "error");
      const run: ResearchRun = { id: crypto.randomUUID(), firm_id: firmId, input, output, created_at: new Date().toISOString() };
      setResearchRuns((current) => [run, ...current].slice(0, 12));
      return run;
    }
  };

  const completeAction: DataContextValue["completeAction"] = async (action) => {
    const completed: ActivityLog = { ...action, completed_at: new Date().toISOString() };
    setActivityLog((current) => current.some((item) => item.action_id === action.action_id) ? current : [completed, ...current]);
    try { await postData({ action: "completeAction", activity: action }); }
    catch (error) { showNotice(error instanceof Error ? error.message : "Action completion saved locally only.", "error"); }
  };

  const authDisabled = async () => "Access is controlled by Vercel Deployment Protection.";
  const signOut = async () => undefined;

  return <DataContext.Provider value={{ firms, contacts, applications, opportunityRuns, researchRuns, activityLog, user: null, live, syncStatus, notice, add, update, remove, importMany, addOpportunityRun, addResearchRun, completeAction, clearNotice: () => setNotice(null), signIn: authDisabled, signUp: authDisabled, signOut }}>{children}</DataContext.Provider>;
}

export const useCareerData = () => {
  const value = useContext(DataContext);
  if (!value) throw new Error("useCareerData must be used inside DataProvider");
  return value;
};
