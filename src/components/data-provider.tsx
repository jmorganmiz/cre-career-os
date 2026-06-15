"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Application, Contact, Firm } from "@/lib/types";

type Resource = "firms" | "contacts" | "applications";
type RecordMap = { firms: Firm; contacts: Contact; applications: Application };
type DataContextValue = {
  firms: Firm[]; contacts: Contact[]; applications: Application[]; user: User | null; live: boolean;
  add: <K extends Resource>(resource: K, value: RecordMap[K]) => Promise<void>;
  remove: (resource: Resource, id?: string) => Promise<void>;
  importMany: <K extends Resource>(resource: K, items: RecordMap[K][]) => Promise<void>;
  signIn: (email: string) => Promise<string>;
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [firms, setFirms] = useState<Firm[]>(demoFirms);
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [applications, setApplications] = useState<Application[]>(demoApplications);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    Promise.all([
      supabase.from("firms").select("*").order("created_at", { ascending: false }),
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
    ]).then(([f, c, a]) => {
      if (f.data) setFirms(f.data);
      if (c.data) setContacts(c.data);
      if (a.data) setApplications(a.data);
    });
  }, [user]);

  const add: DataContextValue["add"] = async (resource, value) => {
    if (supabase && user) {
      const { data, error } = await supabase.from(resource).insert(value).select().single();
      if (error) throw error;
      if (resource === "firms") setFirms((x) => [data as Firm, ...x]);
      if (resource === "contacts") setContacts((x) => [data as Contact, ...x]);
      if (resource === "applications") setApplications((x) => [data as Application, ...x]);
      return;
    }
    const item = { ...value, id: crypto.randomUUID() };
    if (resource === "firms") setFirms((x) => [item as Firm, ...x]);
    if (resource === "contacts") setContacts((x) => [item as Contact, ...x]);
    if (resource === "applications") setApplications((x) => [item as Application, ...x]);
  };

  const remove = async (resource: Resource, id?: string) => {
    if (!id) return;
    if (supabase && user) {
      const { error } = await supabase.from(resource).delete().eq("id", id);
      if (error) throw error;
    }
    if (resource === "firms") setFirms((x) => x.filter((v) => v.id !== id));
    if (resource === "contacts") setContacts((x) => x.filter((v) => v.id !== id));
    if (resource === "applications") setApplications((x) => x.filter((v) => v.id !== id));
  };

  const importMany: DataContextValue["importMany"] = async (resource, items) => {
    if (supabase && user) {
      const { data, error } = await supabase.from(resource).insert(items).select();
      if (error) throw error;
      if (resource === "firms") setFirms((x) => [...(data as Firm[]), ...x]);
      if (resource === "contacts") setContacts((x) => [...(data as Contact[]), ...x]);
      if (resource === "applications") setApplications((x) => [...(data as Application[]), ...x]);
    } else {
      const local = items.map((v) => ({ ...v, id: crypto.randomUUID() }));
      if (resource === "firms") setFirms((x) => [...(local as unknown as Firm[]), ...x]);
      if (resource === "contacts") setContacts((x) => [...(local as unknown as Contact[]), ...x]);
      if (resource === "applications") setApplications((x) => [...(local as unknown as Application[]), ...x]);
    }
  };

  const signIn = async (email: string) => {
    if (!supabase) return "Add Supabase credentials to .env.local first.";
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    return error ? error.message : "Magic sign-in link sent. Check your email.";
  };
  const signOut = async () => { await supabase?.auth.signOut(); };

  return <DataContext.Provider value={{ firms, contacts, applications, user, live: Boolean(supabase && user), add, remove, importMany, signIn, signOut }}>{children}</DataContext.Provider>;
}

export const useCareerData = () => {
  const value = useContext(DataContext);
  if (!value) throw new Error("useCareerData must be used inside DataProvider");
  return value;
};
