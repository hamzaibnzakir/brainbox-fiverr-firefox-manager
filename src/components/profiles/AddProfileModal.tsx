import { useState } from "react";
import { Check } from "lucide-react";
import type { DiscoveredFirefoxProfile, FirefoxProfile } from "@/types";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const STEPS = ["Firefox profile", "Proxy", "Destination"];
interface DraftState { firefoxProfileName:string; accountName:string; countryName:string; countryCode:string; proxyHost:string; proxyPort:string; proxyUsername:string; proxyPassword:string; targetWebsite:string; useDefaultWebsite:boolean; startupDelaySeconds:number; launchOnStartup:boolean; }
const EMPTY_BASE: DraftState = { firefoxProfileName:"", accountName:"", countryName:"", countryCode:"us", proxyHost:"", proxyPort:"", proxyUsername:"", proxyPassword:"", targetWebsite:"", useDefaultWebsite:true, startupDelaySeconds:3, launchOnStartup:false };

export function AddProfileModal({ open, onOpenChange, onCreate, discoveredProfiles }: { open:boolean; onOpenChange:(v:boolean)=>void; onCreate:(p:FirefoxProfile)=>void; discoveredProfiles:DiscoveredFirefoxProfile[]; }) {
  const makeEmpty=():DraftState=>({...EMPTY_BASE, firefoxProfileName:discoveredProfiles.find(p=>!p.inUse)?.name??discoveredProfiles[0]?.name??""});
  const [step,setStep]=useState(0); const [draft,setDraft]=useState<DraftState>(()=>makeEmpty());
  function reset(){setStep(0);setDraft(makeEmpty());}
  function set<K extends keyof DraftState>(key:K,value:DraftState[K]){setDraft(prev=>({...prev,[key]:value}));}
  function finish(){
    const newProfile:FirefoxProfile={id:`p-${Date.now()}`,accountName:draft.accountName||draft.firefoxProfileName,countryCode:draft.countryCode||"us",countryName:draft.countryName||"Unspecified",status:"stopped",proxyHost:draft.proxyHost.trim(),proxyPort:Number(draft.proxyPort)||0,proxyUsername:draft.proxyUsername,proxyPassword:draft.proxyPassword,proxyStatus:"failed",latencyMs:0,externalIp:"—",firefoxProfileName:draft.firefoxProfileName,targetWebsite:draft.targetWebsite.trim(),useDefaultWebsite:draft.useDefaultWebsite,lastLaunched:"Never",startupDelaySeconds:draft.startupDelaySeconds,launchOnStartup:draft.launchOnStartup};
    onCreate(newProfile); reset();
  }
  const canAdvance=(step===0&&!!draft.firefoxProfileName&&!!draft.accountName)||(step===1&&!!draft.proxyHost&&Number(draft.proxyPort)>0&&Number(draft.proxyPort)<=65535)||(step===2&&(draft.useDefaultWebsite||!!draft.targetWebsite.trim()));
  return <Dialog open={open} onOpenChange={v=>{onOpenChange(v);if(!v)reset();}} title="Add profile" description="Configure a new isolated Firefox identity." widthClass="max-w-lg">
    <div className="mb-5 flex items-center gap-2">{STEPS.map((label,i)=><div key={label} className="flex flex-1 items-center gap-2"><div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors",i<step?"border-accent bg-accent text-white":i===step?"border-accent text-accent-soft":"border-border text-text-tertiary")}>{i<step?<Check size={12}/>:i+1}</div><span className={cn("text-[12px]",i===step?"text-text-primary":"text-text-tertiary")}>{label}</span>{i<STEPS.length-1&&<div className="h-px flex-1 bg-border"/>}</div>)}</div>
    {step===0&&<div className="flex flex-col gap-4"><Select label="Discovered Firefox profiles" value={draft.firefoxProfileName} onChange={v=>set("firefoxProfileName",v)} options={discoveredProfiles.map(p=>({value:p.name,label:p.name,hint:p.inUse?"in use":"available"}))}/><Input label="Account name" placeholder="e.g. USA Fiverr" value={draft.accountName} onChange={e=>set("accountName",e.target.value)}/><Input label="Country" placeholder="e.g. United States" value={draft.countryName} onChange={e=>set("countryName",e.target.value)}/></div>}
    {step===1&&<div className="flex flex-col gap-4"><div className="grid grid-cols-2 gap-3"><Input label="Proxy host" placeholder="154.3.233.91" value={draft.proxyHost} onChange={e=>set("proxyHost",e.target.value)}/><Input label="Proxy port" placeholder="5369" type="number" min={1} max={65535} value={draft.proxyPort} onChange={e=>set("proxyPort",e.target.value)}/></div><Input label="Proxy username" value={draft.proxyUsername} onChange={e=>set("proxyUsername",e.target.value)}/><Input label="Proxy password" type="password" value={draft.proxyPassword} onChange={e=>set("proxyPassword",e.target.value)}/></div>}
    {step===2&&<div className="flex flex-col gap-4"><div className="rounded-md border border-border bg-surface px-3 py-2.5"><Switch checked={draft.useDefaultWebsite} onCheckedChange={v=>set("useDefaultWebsite",v)} label="Use default website" description="Recommended. This follows the URL in Settings for every launch."/></div>{!draft.useDefaultWebsite&&<Input label="Profile target website" placeholder="https://www.fiverr.com/..." value={draft.targetWebsite} onChange={e=>set("targetWebsite",e.target.value)}/>}<div className="flex flex-col gap-1.5"><label className="text-[13px] text-text-secondary">Startup delay</label><Slider value={draft.startupDelaySeconds} onChange={v=>set("startupDelaySeconds",v)}/></div><div className="rounded-md border border-border bg-surface px-3 py-2.5"><Switch checked={draft.launchOnStartup} onCheckedChange={v=>set("launchOnStartup",v)} label="Enable on startup" description="Launch this profile automatically with Brainbox"/></div></div>}
    <div className="mt-6 flex items-center justify-between"><Button variant="ghost" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>Back</Button>{step<STEPS.length-1?<Button variant="primary" disabled={!canAdvance} onClick={()=>setStep(s=>s+1)}>Continue</Button>:<Button variant="primary" disabled={!canAdvance} onClick={finish}>Finish</Button>}</div>
  </Dialog>;
}
