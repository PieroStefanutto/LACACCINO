import assert from "node:assert/strict";
import test from "node:test";
import { customerFields, pointsInput } from "../lib/portal/validation.ts";
const form = values => {const data=new FormData();for(const [key,value] of Object.entries(values)) data.set(key,value);return data;};
test("customer profile accepts international names and an optional phone",()=>{
  assert.deepEqual(customerFields(form({first_name:"  Léa ",last_name:"O’Neill",phone:""})),{first_name:"Léa",last_name:"O’Neill",phone:"",display_name:"Léa"});
  assert.ok("error" in customerFields(form({first_name:"",last_name:"Name"})));
  assert.ok("error" in customerFields(form({first_name:"Lea",last_name:"Name",phone:"not-a-number"})));
});
test("points reject fractions, zero, unsafe amounts and invalid booking identifiers",()=>{
  const fields={user_id:"11111111-1111-4111-8111-111111111111",request_key:"22222222-2222-4222-8222-222222222222",amount:"50",reason:"Test correction"};
  assert.equal(pointsInput(form(fields)).amount,50);
  for(const amount of ["0","1.5","1e3","1000001","-1000001","Infinity"]) assert.ok("error" in pointsInput(form({...fields,amount})));
  assert.ok("error" in pointsInput(form({...fields,request_key:"not-a-uuid"})));
});
