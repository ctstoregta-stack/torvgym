import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeSecureStorage = { encrypt(o:{plaintext:string}):Promise<{iv:string;ciphertext:string;version:number}>; decrypt(o:{iv:string;ciphertext:string}):Promise<{plaintext:string}> };
const Native=registerPlugin<NativeSecureStorage>("TorvGymSecureStorage");
const DB="torvgym-secure", STORE="keys";
type Envelope={format:"torvgym-local";version:1;iv:string;ciphertext:string};

async function browserKey():Promise<CryptoKey>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite"),s=tx.objectStore(STORE),g=s.get("local-state");
    g.onsuccess=async()=>{if(g.result)return resolve(g.result as CryptoKey);const k=await crypto.subtle.generateKey({name:"AES-GCM",length:256},false,["encrypt","decrypt"]);s.put(k,"local-state");resolve(k);};g.onerror=()=>reject(g.error);});
}
const b64=(v:Uint8Array)=>btoa(String.fromCharCode(...v));
const bytes=(v:string)=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
export async function encryptLocal(plaintext:string):Promise<string>{
  if(Capacitor.isNativePlatform()){const x=await Native.encrypt({plaintext});return JSON.stringify({format:"torvgym-local",version:1,iv:x.iv,ciphertext:x.ciphertext});}
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await browserKey();
  const ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(plaintext));
  return JSON.stringify({format:"torvgym-local",version:1,iv:b64(iv),ciphertext:b64(new Uint8Array(ct))});
}
export async function decryptLocal(raw:string):Promise<string|null>{
  try{const e=JSON.parse(raw) as Envelope;if(e.format!=="torvgym-local"||e.version!==1)return null;
    if(Capacitor.isNativePlatform())return (await Native.decrypt({iv:e.iv,ciphertext:e.ciphertext})).plaintext;
    return new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes(e.iv)},await browserKey(),bytes(e.ciphertext)));
  }catch{return null;}
}