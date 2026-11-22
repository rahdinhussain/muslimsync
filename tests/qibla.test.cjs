const test=require('node:test');
const assert=require('node:assert/strict');
const {directionToKaaba,smoothHeading,wrap}=require('../src/utils/qibla.cjs');
// Independent reference: project the Kaaba's Earth-centred unit vector onto
// each city's local east/north basis. Distances use the spherical dot product.
const cities=[
  ['Vancouver',49.28,-123.12,16.651466,11973954],['Dhaka',23.8103,90.4125,277.567131,5171960],
  ['Jakarta',-6.2088,106.8456,295.151736,7920138],['Sydney',-33.8688,151.2093,277.499589,13236274],
  ['London',51.5074,-0.1278,118.987219,4793782],['New York',40.7128,-74.006,58.481701,10306321],
  ['Suva',-18.14,178.44,281.894789,15681456]
];
for(const [city,lat,lon,bearing,distance] of cities)test('Qibla bearing and distance in '+city,()=>{
  const fix=directionToKaaba(lat,lon);
  assert.ok(Math.abs(fix.bearing-bearing)<0.00001);
  assert.ok(Math.abs(fix.distance-distance)<1);
});
test('no arbitrary bearing at the Kaaba, antipode, or exact poles',()=>{
  for(const [lat,lon] of [[21.4225,39.8262],[-21.4225,-140.1738],[90,0],[-90,35]])assert.equal(directionToKaaba(lat,lon).bearing,null);
  assert.equal(directionToKaaba(91,0),null);assert.equal(directionToKaaba(0,NaN),null);
});
test('heading crosses true north on the short arc in both directions',()=>{
  const forward=smoothHeading(359,1,100),back=smoothHeading(1,359,100);
  assert.ok(forward>359 && forward<361);assert.ok(back<1 && back>-1);
  assert.equal(wrap(smoothHeading(null,-4,100)),356);
});
