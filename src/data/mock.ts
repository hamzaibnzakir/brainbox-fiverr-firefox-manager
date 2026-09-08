import type { ActivityEvent, DiscoveredFirefoxProfile, FirefoxProfile } from "@/types";

export const profiles: FirefoxProfile[] = [
  { id:"p1", accountName:"USA Fiverr", countryCode:"us", countryName:"United States", status:"ready", proxyHost:"154.3.233.91", proxyPort:5369, proxyUsername:"brainbox_us01", proxyPassword:"", proxyStatus:"healthy", latencyMs:82, externalIp:"154.3.233.91", firefoxProfileName:"Profile 7", targetWebsite:"fiverr.com/users/manage_gigs", useDefaultWebsite:true, lastLaunched:"2 minutes ago", startupDelaySeconds:4, launchOnStartup:true },
  { id:"p2", accountName:"UK Upwork", countryCode:"gb", countryName:"United Kingdom", status:"running", proxyHost:"88.212.44.10", proxyPort:6112, proxyUsername:"brainbox_uk02", proxyPassword:"", proxyStatus:"healthy", latencyMs:64, externalIp:"88.212.44.10", firefoxProfileName:"Profile 3", targetWebsite:"upwork.com/nx/find-work", useDefaultWebsite:false, lastLaunched:"Running now", startupDelaySeconds:2, launchOnStartup:true },
  { id:"p3", accountName:"DE Shopify Ops", countryCode:"de", countryName:"Germany", status:"ready", proxyHost:"45.89.121.6", proxyPort:4321, proxyUsername:"brainbox_de03", proxyPassword:"", proxyStatus:"slow", latencyMs:340, externalIp:"45.89.121.6", firefoxProfileName:"Profile 5", targetWebsite:"admin.shopify.com/store/ozlombok", useDefaultWebsite:false, lastLaunched:"1 hour ago", startupDelaySeconds:6, launchOnStartup:false },
  { id:"p4", accountName:"CA PeoplePerHour", countryCode:"ca", countryName:"Canada", status:"error", proxyHost:"192.99.14.203", proxyPort:8080, proxyUsername:"brainbox_ca04", proxyPassword:"", proxyStatus:"failed", latencyMs:0, externalIp:"—", firefoxProfileName:"Profile 9", targetWebsite:"peopleperhour.com/freelancer/dashboard", useDefaultWebsite:false, lastLaunched:"3 hours ago", startupDelaySeconds:4, launchOnStartup:false },
  { id:"p5", accountName:"AU Etsy Store", countryCode:"au", countryName:"Australia", status:"ready", proxyHost:"103.87.169.44", proxyPort:3128, proxyUsername:"brainbox_au05", proxyPassword:"", proxyStatus:"healthy", latencyMs:121, externalIp:"103.87.169.44", firefoxProfileName:"Profile 2", targetWebsite:"etsy.com/your/shops/me/dashboard", useDefaultWebsite:false, lastLaunched:"Yesterday", startupDelaySeconds:3, launchOnStartup:true },
  { id:"p6", accountName:"SG App Outreach", countryCode:"sg", countryName:"Singapore", status:"stopped", proxyHost:"128.199.85.17", proxyPort:5555, proxyUsername:"brainbox_sg06", proxyPassword:"", proxyStatus:"healthy", latencyMs:95, externalIp:"128.199.85.17", firefoxProfileName:"Profile 11", targetWebsite:"play.google.com/console/developers", useDefaultWebsite:false, lastLaunched:"2 days ago", startupDelaySeconds:5, launchOnStartup:false },
];

export const discoveredFirefoxProfiles: DiscoveredFirefoxProfile[] = [
  { id:"fp1", name:"Profile 1", inUse:false }, { id:"fp2", name:"Profile 2", inUse:true }, { id:"fp3", name:"Profile 3", inUse:true }, { id:"fp4", name:"Profile 4", inUse:false }, { id:"fp5", name:"Profile 5", inUse:true }, { id:"fp6", name:"Profile 6", inUse:false }, { id:"fp7", name:"Profile 7", inUse:true }, { id:"fp12", name:"Profile 12", inUse:false },
];

export const activity: ActivityEvent[] = [
  { id:"a1", kind:"launch", message:"Profile launched", profileName:"USA Fiverr", timestamp:"2 minutes ago" },
  { id:"a2", kind:"auth", message:"Proxy authentication successful", profileName:"USA Fiverr", timestamp:"2 minutes ago" },
  { id:"a3", kind:"browser-open", message:"Firefox opened", profileName:"USA Fiverr", timestamp:"2 minutes ago" },
  { id:"a4", kind:"page-load", message:"Website loaded", profileName:"USA Fiverr", timestamp:"1 minute ago" },
  { id:"a5", kind:"error", message:"Proxy authentication failed, retrying", profileName:"CA PeoplePerHour", timestamp:"3 hours ago" },
  { id:"a6", kind:"stop", message:"Profile stopped", profileName:"SG App Outreach", timestamp:"2 days ago" },
  { id:"a7", kind:"launch", message:"Profile launched", profileName:"UK Upwork", timestamp:"3 days ago" },
  { id:"a8", kind:"page-load", message:"Website loaded", profileName:"AU Etsy Store", timestamp:"Yesterday" },
];
