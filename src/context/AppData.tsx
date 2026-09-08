import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type AppSettings, type AppSnapshot } from "@/lib/api";
import type { FirefoxProfile } from "@/types";

const DEFAULT_SITE="https://www.fiverr.com/users/manage_gigs";
const FALLBACK:AppSnapshot={engineOnline:false,platform:"Backend disconnected",autostart:false,profiles:[],activity:[],discoveredFirefoxProfiles:[],settings:{workspaceName:"Brainbox",firefoxBinary:"",launchOnLogin:false,launchAllAuto:true,startupDelay:12,defaultSite:DEFAULT_SITE,theme:"dark",notifyProxyFail:true,notifyLaunch:false,refreshEnabled:false,refreshMinMinutes:5,refreshMaxMinutes:15}};
type ContextValue=AppSnapshot&{loading:boolean;error:string|null;refresh:()=>Promise<void>;startAll:()=>Promise<void>;restartAll:()=>Promise<void>;stopAll:()=>Promise<void>;launchProfile:(id:string)=>Promise<void>;stopProfile:(id:string)=>Promise<void>;createProfile:(p:FirefoxProfile)=>Promise<void>;updateProfile:(p:FirefoxProfile)=>Promise<void>;deleteProfile:(id:string)=>Promise<void>;duplicateProfile:(id:string)=>Promise<void>;testProxy:(id:string)=>Promise<void>;testAllProxies:()=>Promise<void>;saveSettings:(s:AppSettings)=>Promise<void>;refreshProfile:(id:string)=>Promise<void>};
const Ctx=createContext<ContextValue|null>(null);
export function AppDataProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<AppSnapshot>(FALLBACK); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
 const apply=useCallback(async(fn:()=>Promise<AppSnapshot>)=>{try{const next=await fn();setData(next);setError(null);}catch(e){setError(e instanceof Error?e.message:"Backend unavailable");throw e;}},[]);
 const refresh=useCallback(async()=>{try{await apply(api.snapshot);}catch{}finally{setLoading(false);}},[apply]);
 useEffect(()=>{void refresh();const timer=window.setInterval(()=>{void api.snapshot().then(setData).then(()=>setError(null)).catch(()=>{});},2500);return()=>window.clearInterval(timer);},[refresh]);
 const action=useCallback((fn:()=>Promise<AppSnapshot>)=>apply(fn).catch(()=>{}),[apply]);
 const testProxy=useCallback(async(id:string)=>{await apply(()=>api.testProxy(id));},[apply]);
 const value=useMemo<ContextValue>(()=>({...data,loading,error,refresh,startAll:()=>action(api.startAll),restartAll:()=>action(api.restartAll),stopAll:()=>action(api.stopAll),launchProfile:id=>action(()=>api.launchProfile(id)),stopProfile:id=>action(()=>api.stopProfile(id)),createProfile:p=>action(()=>api.createProfile(p)),updateProfile:p=>action(()=>api.updateProfile(p)),deleteProfile:id=>action(()=>api.deleteProfile(id)),duplicateProfile:id=>action(()=>api.duplicateProfile(id)),testProxy,testAllProxies:()=>action(api.testAllProxies),saveSettings:s=>action(()=>api.saveSettings(s)),refreshProfile:id=>action(()=>api.refreshProfile(id))}),[data,loading,error,refresh,action,testProxy]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAppData(){const value=useContext(Ctx);if(!value)throw new Error("useAppData must be used inside AppDataProvider");return value;}
