mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
      container: "map", // container ID
      style : "mapbox://styles/mapbox/streets-v12", //style url  dark-v11 (dark mode)
      center: listing.geometry.coordinates, // starting position [lng, lat]
      zoom: 9 // starting zoom
});

// console.log(coordinates);

const marker = new mapboxgl.Marker({ color: "red" })
.setLngLat (listing.geometry.coordinates)      // Listing.geometry.coordinates
.setPopup(new mapboxgl.Popup({offset : 25})
.setHTML (
  
` <h6> ${listing.location} </h6><p> Exact Location provided after booking </p> `
))
.addTo(map);