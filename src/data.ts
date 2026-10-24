import type {Vehicle,Trip} from './types';
export const seedVehicles:Vehicle[]=[
{id:'v1',name:'Van 01',plate:'KL-07-BX-2401',driver:'Arun Kumar',status:'Moving',lat:10.015,lng:76.341,speed:48,fuel:72,battery:96,lastSeen:'12 sec ago',distanceToday:86.4,tripsToday:4,ignition:true,health:94},
{id:'v2',name:'Truck 02',plate:'KL-07-BX-2402',driver:'Rahul S',status:'Attention',lat:10.032,lng:76.312,speed:71,fuel:18,battery:83,lastSeen:'8 sec ago',distanceToday:112.8,tripsToday:3,ignition:true,health:61},
{id:'v3',name:'Van 03',plate:'KL-07-BX-2403',driver:'Meera Nair',status:'Idle',lat:9.998,lng:76.356,speed:0,fuel:54,battery:91,lastSeen:'1 min ago',distanceToday:42.1,tripsToday:2,ignition:false,health:88},
{id:'v4',name:'Truck 04',plate:'KL-07-BX-2404',driver:'Sanjay P',status:'Moving',lat:10.045,lng:76.365,speed:39,fuel:63,battery:77,lastSeen:'20 sec ago',distanceToday:98.6,tripsToday:5,ignition:true,health:90},
{id:'v5',name:'Van 05',plate:'KL-07-BX-2405',driver:'Anjali R',status:'Offline',lat:10.006,lng:76.292,speed:0,fuel:31,battery:22,lastSeen:'2 hr ago',distanceToday:17.3,tripsToday:1,ignition:false,health:45},
{id:'v6',name:'Truck 06',plate:'KL-07-BX-2406',driver:'Faisal M',status:'Moving',lat:9.981,lng:76.328,speed:56,fuel:81,battery:88,lastSeen:'15 sec ago',distanceToday:124.2,tripsToday:4,ignition:true,health:92}
];
export const seedTrips:Trip[]=[
{id:'t1',vehicle_id:'v1',vehicle:'Van 01',driver:'Arun Kumar',start:'Kakkanad Hub',end:'Fort Kochi',distance:24.8,duration:52,avgSpeed:29,maxSpeed:58,stops:2,overspeed:0,startLat:10.015,startLng:76.341,endLat:9.967,endLng:76.243,date:'Today, 10:42 AM'},
{id:'t2',vehicle_id:'v2',vehicle:'Truck 02',driver:'Rahul S',start:'Aluva Depot',end:'Edappally',distance:18.2,duration:31,avgSpeed:42,maxSpeed:78,stops:1,overspeed:2,startLat:10.032,startLng:76.312,endLat:10.026,endLng:76.308,date:'Today, 10:18 AM'},
{id:'t3',vehicle_id:'v4',vehicle:'Truck 04',driver:'Sanjay P',start:'Kakkanad Hub',end:'Thrippunithura',distance:31.6,duration:64,avgSpeed:34,maxSpeed:62,stops:3,overspeed:0,startLat:10.045,startLng:76.365,endLat:9.949,endLng:76.342,date:'Today, 09:56 AM'},
{id:'t4',vehicle_id:'v6',vehicle:'Truck 06',driver:'Faisal M',start:'Vyttila',end:'Kalamassery',distance:27.4,duration:48,avgSpeed:38,maxSpeed:69,stops:1,overspeed:1,startLat:9.981,startLng:76.328,endLat:10.061,endLng:76.326,date:'Today, 09:21 AM'},
{id:'t5',vehicle_id:'v3',vehicle:'Van 03',driver:'Meera Nair',start:'Fort Kochi',end:'Kakkanad Hub',distance:22.1,duration:55,avgSpeed:25,maxSpeed:51,stops:4,overspeed:0,startLat:9.967,startLng:76.243,endLat:9.998,endLng:76.356,date:'Today, 08:45 AM'}
];