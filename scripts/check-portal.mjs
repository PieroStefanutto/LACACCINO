import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,options);
const file="artifacts/portal-fixtures.json";
async function cleanup(records) {
  for(const row of [...records].reverse()) {
    const result=await admin.auth.admin.deleteUser(row.id);
    assert.ok(!result.error,"remove disposable account");
  }
}
if(process.argv.includes("--cleanup")) {
  if(existsSync(file)) {await cleanup(JSON.parse(readFileSync(file,"utf8")));unlinkSync(file);}
  console.log("Portal test accounts removed.");process.exit(0);
}
const records=[];
async function user(label,metadata={},confirmed=true) {
  const email=`portal-${label}-${randomUUID()}@example.com`;
  const password=randomBytes(24).toString("base64url")+"!Aa1";
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:confirmed,user_metadata:metadata});
  assert.ok(!error,`create disposable ${label}`);
  const row={id:data.user.id,email,password,label};records.push(row);
  const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);
  if(confirmed) assert.ok(!(await client.auth.signInWithPassword({email,password})).error);
  return {...row,client};
}
let keep=false;
try {
  const alice=await user("customer",{first_name:"Lea",last_name:"Beispiel",newsletter:true,newsletter_version:"newsletter-2026-09-18"});
  const bob=await user("other",{first_name:"Ben",last_name:"Test"});
  const operator=await user("admin");
  const pending=await user("unconfirmed",{newsletter:true,newsletter_version:"newsletter-2026-09-18"},false);
  assert.equal((await admin.from("newsletter_preferences").select("*").eq("user_id",pending.id)).data.length,0,"unverified email never confirms newsletter");
  assert.equal((await alice.client.from("newsletter_preferences").select("subscribed").eq("user_id",alice.id).single()).data.subscribed,true,"registration consent imported only on verified account");
  assert.equal((await alice.client.from("profiles").select("*").eq("id",bob.id)).data.length,0,"customer profile RLS");
  assert.equal((await alice.client.from("loyalty_accounts").select("*").eq("user_id",bob.id)).data.length,0,"points RLS");
  assert.ok((await alice.client.from("loyalty_accounts").update({balance:999}).eq("user_id",alice.id)).error,"direct balance writes denied");
  assert.ok((await alice.client.from("portal_admins").insert({user_id:alice.id,username:"TEST"})).error,"role escalation denied");
  assert.ok((await alice.client.from("newsletter_preferences").update({subscribed:false}).eq("user_id",alice.id)).error,"direct consent writes denied");
  await alice.client.auth.updateUser({data:{admin:true,role:"admin"}});
  assert.equal((await alice.client.rpc("portal_is_admin")).data,false,"editable metadata never grants admin");
  const key=randomUUID();
  const book=(client,amount,reason,requestKey=randomUUID())=>client.rpc("portal_adjust_points",{target_user:alice.id,points_delta:amount,booking_reason:reason,request_key:requestKey});
  assert.ok((await book(alice.client,100,"Unauthorized")).error,"customer RPC booking denied");
  assert.ok(!(await admin.from("portal_admins").insert({user_id:operator.id,username:`TEST-${randomUUID()}`.toUpperCase(),must_change_password:true})).error);
  assert.ok((await book(operator.client,100,"Initial password")).error,"initial admin password cannot book points");
  await admin.from("portal_admins").update({must_change_password:false}).eq("user_id",operator.id);
  const same=await Promise.all([book(operator.client,100,"Willkommensgutschrift (Test)",key),book(operator.client,100,"Willkommensgutschrift (Test)",key)]);
  same.forEach(result=>assert.ok(!result.error,"concurrent retry succeeds once"));
  assert.equal((await alice.client.from("loyalty_accounts").select("balance").single()).data.balance,100,"retry never duplicates balance");
  assert.equal((await alice.client.from("loyalty_entries").select("id")).data.length,1,"one immutable booking");
  assert.ok((await book(operator.client,-101,"Too much")).error,"negative balance rejected");
  assert.ok((await book(operator.client,101,"Different payload",key)).error,"idempotency payload reuse rejected");
  assert.ok(!(await book(operator.client,-25,"Korrektur (Test)")).error);
  const different=await Promise.all([book(operator.client,10,"Gutschrift (Test)"),book(operator.client,20,"Gutschrift (Test)")]);
  different.forEach(result=>assert.ok(!result.error));
  assert.equal((await alice.client.from("loyalty_accounts").select("balance").single()).data.balance,105,"concurrent distinct bookings are atomic");
  assert.equal((await bob.client.from("loyalty_entries").select("*").eq("user_id",alice.id)).data.length,0,"ledger RLS");
  assert.ok((await alice.client.from("loyalty_entries").delete().eq("user_id",alice.id)).error,"customer cannot delete history");
  assert.ok(!(await alice.client.rpc("portal_set_newsletter",{wants_newsletter:false})).error);
  assert.ok(!(await alice.client.rpc("portal_set_newsletter",{wants_newsletter:false})).error);
  assert.equal((await alice.client.from("newsletter_events").select("*")).data.length,2,"withdrawal recorded, repeated withdrawal does not duplicate");
  assert.equal((await alice.client.from("newsletter_preferences").select("subscribed").single()).data.subscribed,false);
  assert.ok((await bob.client.rpc("portal_customer_list")).error,"customer cannot list customers");
  const list=await operator.client.rpc("portal_customer_list",{search_term:alice.email,page_offset:0});
  assert.equal(list.data[0].id,alice.id,"admin search restricted to matching customer");
  assert.equal(Number(list.data[0].balance),105,"admin sees persisted balance");
  console.log("PASS: profiles, verified newsletter consent, withdrawal history, RLS, admin roles, first-password gate, atomic points, idempotency, overdraft rejection and customer search.");
  if(process.env.PORTAL_KEEP_FIXTURES==="true") {writeFileSync(file,JSON.stringify(records));keep=true;console.log("Disposable fixtures retained temporarily for browser verification.");}
} finally {
  if(!keep) {await cleanup(records);console.log("Disposable portal data removed.");}
}
