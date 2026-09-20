-- Explicit fictional fixtures. The guard makes accidental production execution fail.
do $$ begin
  if not exists(select 1 from public._club_local_only where id) then raise exception 'Local demo only'; end if;
end $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','mila@example.invalid',now(),'{"first_name":"Mila","last_name":"Beispiel"}'),
 ('10000000-0000-4000-8000-000000000002','jonas@example.invalid',now(),'{"first_name":"Jonas","last_name":"Test"}'),
 ('10000000-0000-4000-8000-000000000003','team@example.invalid',now(),'{"first_name":"Alex","last_name":"Demo"}'),
 ('10000000-0000-4000-8000-000000000004','leitung@example.invalid',now(),'{"first_name":"Kim","last_name":"Demo"}'),
 ('10000000-0000-4000-8000-000000000005','admin@example.invalid',now(),'{"first_name":"Robin","last_name":"Administration"}');
insert into public.portal_admins(user_id,username,must_change_password) values('10000000-0000-4000-8000-000000000005','LOCAL-DEMO-ADMIN',false);
insert into public.staff_members(user_id,first_name,last_name,email,hourly_cents,must_change_password) values
 ('10000000-0000-4000-8000-000000000003','Alex','Demo','team@example.invalid',0,false),
 ('10000000-0000-4000-8000-000000000004','Kim','Demo','leitung@example.invalid',0,false);
insert into public.club_locations(id,name,status,confirmed,address,latitude,longitude,hours,amenities) values
 ('20000000-0000-4000-8000-000000000001','Demo-Atelier · fiktiv','open',true,'Musterstraße 1, Musterstadt (kein echtes Café)',48.99,9.15,'Nur Testdaten. Keine echten Öffnungszeiten.','Fiktiver Teststandort'),
 ('20000000-0000-4000-8000-000000000002','Zweiter Teststandort · fiktiv','open',true,'Beispielweg 2, Musterstadt (kein echtes Café)',49.01,9.17,'Keine echten Öffnungszeiten.','');
insert into public.club_locations(name,status) select city,'vision' from unnest(array['Stuttgart','Hamburg','Mallorca','Bangkok','London','Dubai']) city;
insert into public.club_staff_roles values
 ('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','employee'),
 ('10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','manager');
insert into public.club_memberships(id,user_id,member_number,card_identifier) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','LC-DEMO-MILA','40000000-0000-4000-8000-000000000001'),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','LC-DEMO-JONAS','40000000-0000-4000-8000-000000000002');
insert into public.club_drinks(id,name,description,active) values
 ('50000000-0000-4000-8000-000000000001','Cappuccino · Demo','Fiktives Testsortiment, noch kein Verkaufsangebot.',true),
 ('50000000-0000-4000-8000-000000000002','Café Crema · Demo','Fiktives Testsortiment.',true);
insert into public.club_drink_variants(id,drink_id,size,temperature,milk,extras) values
 ('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Normal','Heiß','Hafer','Keine'),
 ('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','Normal','Heiß','Milch','Keine'),
 ('60000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','Normal','Heiß','Ohne','Keine');
insert into public.club_rules(location_id,title,cents_per_point,conditions,active) values('20000000-0000-4000-8000-000000000001','DEMO: 1 Punkt je 1 Euro',100,'Reines Rechenbeispiel für lokale Tests. Keine festgelegte Geschäftsregel.',true);
insert into public.club_rewards(id,title,description,points,conditions,active) values
 ('70000000-0000-4000-8000-000000000001','Ein Kaffeemoment · Demo','Testprämie ohne wirtschaftlichen Wert.',20,'Nur lokale Demo. 20 fiktive Punkte, kein echter Anspruch. Ausgabe nur durch berechtigtes Personal.',true),
 ('70000000-0000-4000-8000-000000000002','Ein zweiter Moment · Demo','Zum Testen des Fortschritts.',60,'Fiktive Demo-Prämie. Keine verbindliche Treueregel.',true);
insert into public.club_content(id,kind,title,body,published,capacity) values
 ('80000000-0000-4000-8000-000000000001','news','Dein tägliches Ritual. Neu gedacht.','Dies ist eine fiktive Meldung der lokalen Club-Demo. Der geplante Markenstart bleibt 2029.',true,null),
 ('80000000-0000-4000-8000-000000000002','event','Demo: Ein Platz am Kaffeetisch','Fiktives Event mit genau einem Testplatz. Keine echte Veranstaltung.',true,1);
-- Both customers start at zero. Points must be booked through the staff workflow.
