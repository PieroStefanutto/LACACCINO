// Reads the initial password from stdin. Never log or commit a password.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const password=readFileSync(0,"utf8").replace(/[\r\n]+$/,"");
if(password.length<8||password.length>128) throw new Error("An initial password must be supplied securely on stdin.");
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const existing=await db.from("portal_admins").select("user_id").eq("username","LACACCINO").maybeSingle();
if(existing.error) throw new Error("Admin registry unavailable.");
if(existing.data) {console.log("Admin already provisioned. Existing credentials were not changed.");process.exit(0);}
const created=await db.auth.admin.createUser({email:"lacaccino-admin@accounts.lacaccino.invalid",password,email_confirm:true,app_metadata:{provisioned_for:"lacaccino-administration"}});
if(created.error) throw new Error(`Admin creation failed (code: ${created.error.code}, status: ${created.error.status}); no credentials were logged.`);
const role=await db.from("portal_admins").insert({user_id:created.data.user.id,username:"LACACCINO",must_change_password:true});
if(role.error) {
  await db.auth.admin.deleteUser(created.data.user.id);
  throw new Error("Admin role creation failed; newly created account removed.");
}
console.log("Admin LACACCINO created. First login requires an individual password. No email was sent.");
