const radians = n => n * Math.PI / 180;
const degrees = n => n * 180 / Math.PI;
const wrap = angle => (angle % 360 + 360) % 360;
const latitude = radians(21.4225), longitude = 39.8262;

function directionToKaaba(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return null;
  const phi = radians(lat), delta = radians(longitude-lon);
  const east = Math.sin(delta)*Math.cos(latitude);
  const north = Math.cos(phi)*Math.sin(latitude)-Math.sin(phi)*Math.cos(latitude)*Math.cos(delta);
  const dot = Math.sin(phi)*Math.sin(latitude)+Math.cos(phi)*Math.cos(latitude)*Math.cos(delta);
  const distance = 6371008.8*Math.atan2(Math.hypot(north,east),dot);
  // At the destination or the exact antipode the initial direction is undefined.
  const bearing = distance<20 || Math.abs(lat)===90 || Math.hypot(east,north)<1e-10 ? null : wrap(degrees(Math.atan2(east,north)));
  return {bearing,distance};
}
function smoothHeading(previous, measurement, elapsed) {
  if (previous == null) return wrap(measurement);
  const delta = wrap(measurement-previous+180)-180;
  const alpha = 1-Math.exp(-Math.max(20,Math.min(1500,elapsed))/140);
  return previous+delta*alpha;
}
module.exports={directionToKaaba,smoothHeading,wrap};
