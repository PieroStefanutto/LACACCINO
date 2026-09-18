import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {randomBytes} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const base=process.env.CHECK_URL||"http://localhost:3103";
const fixturePath="artifacts/portal-fixtures.json";
const fixtures=JSON.parse(readFileSync(fixturePath,"utf8"));
const customer=fixtures.find(r=>r.label==="customer"),operator=fixtures.find(r=>r.label==="admin");
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
function fields(html,marker) {
  const form=[...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(m=>m[0]).find(v=>v.includes(marker));
  assert.ok(form,`form ${marker}`);
  const data=new FormData();
  for(const match of form.matchAll(/<input\b[^>]*>/g)) {
    const input=match[0];if(!input.includes('type="hidden"'))continue;
    const name=input.match(/name="([^"]+)"/)?.[1];
    if(name)data.append(decode(name),decode(input.match(/value="([^"]*)"/)?.[1]||""));
  }
  return data;
}
function client() {
  const jar=new Map();
  return async(path,data)=>{
    const response=await fetch(new URL(path,base),{redirect:"manual",method:data?"POST":"GET",headers:{cookie:[...jar].map(([k,v])=>k+"="+v).join("; "),...(data?{origin:new URL(base).origin}:{})},...(data?{body:data}:{})});
    for(const header of response.headers.getSetCookie()) {const pair=header.split(";")[0],i=pair.indexOf("=");jar.set(pair.slice(0,i),pair.slice(i+1));}
    return {response,html:await response.text()};
  };
}
const adminRequest=client(),customerRequest=client(),anonymousRequest=client();
let contactId;
try {
  const locked=await anonymousRequest("/admin");
  assert.equal(locked.response.status,307,"anonymous admin access redirects");
  assert.ok(locked.response.headers.get("location")?.includes("/admin/anmelden"));
  let page=await customerRequest("/konto");
  let data=fields(page.html,'id="auth-email"');data.set("email",customer.email);data.set("password",customer.password);data.set("mode","login");
  const login=await customerRequest("/konto",data);
  assert.equal(login.response.status,303);assert.equal(login.response.headers.get("location"),"/konto?welcome=1","login triggers arrival");
  const denied=await customerRequest("/admin");
  assert.equal(denied.response.status,307);assert.ok(denied.response.headers.get("location")?.endsWith("/konto"));
  const role=await db.from("portal_admins").select("username").eq("user_id",operator.id).single();
  page=await adminRequest("/admin/anmelden");
  data=fields(page.html,'id="admin-username"');data.set("username",role.data.username);data.set("password",operator.password);
  assert.equal((await adminRequest("/admin/anmelden",data)).response.status,303);
  page=await adminRequest("/admin");
  assert.equal(page.response.status,200);assert.ok(page.response.headers.get("cache-control")?.includes("no-store"));
  const detailPath="/admin/kunden/"+customer.id;
  page=await adminRequest(detailPath);
  assert.equal(page.response.status,200);
  const booking=fields(page.html,'id="points-amount"');
  booking.set("amount","7");booking.set("reason","HTTP-Prüfbuchung (Test)");
  const before=(await db.from("loyalty_accounts").select("balance").eq("user_id",customer.id).single()).data.balance;
  await customerRequest(detailPath,booking);
  await anonymousRequest(detailPath,booking);
  assert.equal((await db.from("loyalty_accounts").select("balance").eq("user_id",customer.id).single()).data.balance,before,"replayed admin action denied for customer and anonymous visitor");
  await adminRequest(detailPath,booking);await adminRequest(detailPath,booking);
  assert.equal((await db.from("loyalty_accounts").select("balance").eq("user_id",customer.id).single()).data.balance,before+7,"admin action books once");
  const contact=await db.from("contact_requests").insert({name:"Portal Test",email:customer.email,message:"Disposable admin inbox verification.",consent_version:"contact-2026-09-17"}).select("id").single();
  assert.ok(!contact.error);contactId=contact.data.id;
  page=await adminRequest("/admin");
  const status=fields(page.html,'contact-status-'+contactId);status.set("status","closed");
  await customerRequest("/admin",status);
  assert.equal((await db.from("contact_requests").select("status").eq("id",contactId).single()).data.status,"new","customer cannot update inbox");
  await adminRequest("/admin",status);
  assert.equal((await db.from("contact_requests").select("status").eq("id",contactId).single()).data.status,"closed","admin processes inquiry");
  await db.from("portal_admins").update({must_change_password:true}).eq("user_id",operator.id);
  page=await adminRequest("/admin");
  assert.ok(page.response.headers.get("location")?.includes("/admin/passwort"),"first password gate rechecked on each request");
  const gated=await adminRequest(detailPath,booking);
  assert.ok(gated.response.headers.get("location")?.includes("/admin/passwort"),"first password gate protects mutations");
  page=await adminRequest("/admin/passwort");
  const passwordForm=fields(page.html,'id="admin-new-password"');
  const newPassword=randomBytes(24).toString("base64url")+"!Aa2";
  passwordForm.set("password",newPassword);passwordForm.set("password_confirm",newPassword);
  const changed=await adminRequest("/admin/passwort",passwordForm);
  assert.equal(changed.response.status,303);
  operator.password=newPassword;writeFileSync(fixturePath,JSON.stringify(fixtures));
  assert.equal((await db.from("portal_admins").select("must_change_password").eq("user_id",operator.id).single()).data.must_change_password,false);
  console.log("PASS: admin HTTP authorization, no-store, customer replay rejection, points/idempotency, contact processing and initial password change.");
} finally {
  if(contactId)assert.ok(!(await db.from("contact_requests").delete().eq("id",contactId)).error);
}
