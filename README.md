# Fieldnotes · Sky

An interactive introduction to the celestial sphere and the apparent daily motion of stars.

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local URL. Use `npm run build` to create the production build, `npm test` to run the astronomy-model tests, and `npm run lint` to check the source.

## Explore

- Drag the sphere to inspect it from different directions; select a star in the scene or the star picker to see its coordinates and current altitude and azimuth.
- Scrub the sidereal clock or start playback. Playback speeds are simulated minutes per real second.
- Change observer latitude to see the celestial pole and star paths shift relative to the horizon.
- Toggle the altitude/azimuth grid and the Summer Triangle asterism.

## Model

The curated bright-star positions use fixed right ascension and declination. UTC is converted to Greenwich mean sidereal time, then equatorial coordinates are transformed to local east/up/north and altitude/azimuth. Longitude is fixed at 0° (Greenwich); nutation, precession, atmospheric refraction, proper motion, and light pollution are not modeled. This is a teaching model, not an observing or navigation instrument.