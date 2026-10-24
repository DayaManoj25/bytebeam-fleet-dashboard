-- Seed a Kochi-area demo fleet. Execute after schema.sql.
insert into public.drivers(id,name,phone) values
('10000000-0000-4000-8000-000000000001','Arun Kumar','+91-90000-10001'),
('10000000-0000-4000-8000-000000000002','Rahul S','+91-90000-10002'),
('10000000-0000-4000-8000-000000000003','Meera Nair','+91-90000-10003'),
('10000000-0000-4000-8000-000000000004','Sanjay P','+91-90000-10004'),
('10000000-0000-4000-8000-000000000005','Anjali R','+91-90000-10005'),
('10000000-0000-4000-8000-000000000006','Faisal M','+91-90000-10006') on conflict do nothing;
insert into public.vehicles(id,name,plate,driver_id,status,latitude,longitude,speed_kph,fuel_percent,battery_percent,ignition,distance_today,trips_today,health_score) values
('20000000-0000-4000-8000-000000000001','Van 01','KL-07-BX-2401','10000000-0000-4000-8000-000000000001','Moving',10.015,76.341,48,72,96,true,86.4,4,94),
('20000000-0000-4000-8000-000000000002','Truck 02','KL-07-BX-2402','10000000-0000-4000-8000-000000000002','Attention',10.032,76.312,71,18,83,true,112.8,3,61),
('20000000-0000-4000-8000-000000000003','Van 03','KL-07-BX-2403','10000000-0000-4000-8000-000000000003','Idle',9.998,76.356,0,54,91,false,42.1,2,88),
('20000000-0000-4000-8000-000000000004','Truck 04','KL-07-BX-2404','10000000-0000-4000-8000-000000000004','Moving',10.045,76.365,39,63,77,true,98.6,5,90),
('20000000-0000-4000-8000-000000000005','Van 05','KL-07-BX-2405','10000000-0000-4000-8000-000000000005','Offline',10.006,76.292,0,31,22,false,17.3,1,45),
('20000000-0000-4000-8000-000000000006','Truck 06','KL-07-BX-2406','10000000-0000-4000-8000-000000000006','Moving',9.981,76.328,56,81,88,true,124.2,4,92) on conflict do nothing;
insert into public.trips(vehicle_id,driver_id,start_location,end_location,start_lat,start_lng,end_lat,end_lng,started_at,ended_at,distance_km,duration_minutes,avg_speed_kph,max_speed_kph,halt_count,overspeed_events) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Kakkanad Hub','Fort Kochi',10.015,76.341,9.967,76.243,now()-interval '2 hours',now()-interval '1 hour 8 minutes',24.8,52,29,58,2,0),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Aluva Depot','Edappally',10.032,76.312,10.026,76.308,now()-interval '2 hours 25 minutes',now()-interval '1 hour 54 minutes',18.2,31,42,78,1,2),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','Kakkanad Hub','Thrippunithura',10.045,76.365,9.949,76.342,now()-interval '3 hours',now()-interval '1 hour 56 minutes',31.6,64,34,62,3,0),
('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000006','Vyttila','Kalamassery',9.981,76.328,10.061,76.326,now()-interval '3 hours 40 minutes',now()-interval '2 hours 52 minutes',27.4,48,38,69,1,1) on conflict do nothing;
