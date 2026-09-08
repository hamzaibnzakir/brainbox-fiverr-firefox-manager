import { useMemo, useState } from "react";
import { Filter, Plus } from "lucide-react";
import type { FirefoxProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import { SearchField } from "@/components/ui/SearchField";
import { ProfileRow } from "./ProfileRow";
import { ProfileListHeader } from "./ProfileListHeader";
import { ProfileDrawer } from "./ProfileDrawer";
import { AddProfileModal } from "./AddProfileModal";
import { useAppData } from "@/context/AppData";

export function ProfilesPage() {
  const { profiles, discoveredFirefoxProfiles, launchProfile, stopProfile, duplicateProfile, deleteProfile, updateProfile, createProfile, testProxy } = useAppData();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const filtered = useMemo(() => { const q=query.trim().toLowerCase(); if(!q) return profiles; return profiles.filter(p => p.accountName.toLowerCase().includes(q)||p.targetWebsite.toLowerCase().includes(q)||p.proxyHost.includes(q)); }, [profiles,query]);
  const editingProfile = profiles.find((p) => p.id === editingId) ?? null;
  return <div className="px-8 py-8">
    <div className="mb-5 flex items-center justify-between"><div><h1 className="text-lg font-semibold tracking-tight text-text-primary">Browser Profiles</h1><p className="mt-0.5 text-[13px] text-text-secondary">{profiles.length} profiles configured across {new Set(profiles.map((p) => p.countryCode)).size} regions</p></div><div className="flex items-center gap-2"><SearchField value={query} onChange={setQuery}/><Button variant="secondary" size="md"><Filter size={13}/> Filter</Button><Button variant="primary" size="md" onClick={()=>setAddOpen(true)}><Plus size={14}/> Add Profile</Button></div></div>
    <div className="overflow-hidden rounded-lg border border-border bg-surface"><ProfileListHeader/>{filtered.length===0?<div className="px-4 py-10 text-center text-[13px] text-text-tertiary">No profiles match "{query}".</div>:filtered.map(profile=><ProfileRow key={profile.id} profile={profile} selected={selectedId===profile.id} onSelect={()=>setSelectedId(profile.id)} onEdit={()=>setEditingId(profile.id)} onLaunch={()=>void launchProfile(profile.id)} onStop={()=>void stopProfile(profile.id)} onDuplicate={()=>void duplicateProfile(profile.id)} onDelete={()=>void deleteProfile(profile.id)}/>)}</div>
    <ProfileDrawer profile={editingProfile} discoveredProfiles={discoveredFirefoxProfiles} open={!!editingProfile} onOpenChange={(v)=>!v&&setEditingId(null)} onSave={(p)=>{void updateProfile(p); setEditingId(null);}} onTestProxy={(id)=>testProxy(id)}/>
    <AddProfileModal discoveredProfiles={discoveredFirefoxProfiles} open={addOpen} onOpenChange={setAddOpen} onCreate={(p)=>{void createProfile(p); setAddOpen(false);}}/>
  </div>;
}
