import { useEffect, useState, type CSSProperties } from 'react'
import { Compass, Crosshair, Pause, Play, RotateCcw, Star, X } from 'lucide-react'
import { equatorialToHorizontal, getDailyBehavior, STARS } from './astronomy'
import { SphereView } from './SphereView'
import './App.css'

const START_OF_DAY = new Date('2026-10-07T00:00:00.000Z')
const SPEEDS = [60, 600]
const CONSTELLATION_PAIRS = [['vega', 'deneb'], ['deneb', 'altair'], ['altair', 'vega']]
const belowHorizonCopy = 'below the horizon all day'

function formatLatitude(latitude: number) {
  return `${Math.abs(latitude)}° ${latitude < 0 ? 'S' : 'N'}`
}

function formatTime(hours: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }).format(new Date(START_OF_DAY.getTime() + hours * 3_600_000))
}

function App() {
  const [latitude, setLatitude] = useState(40)
  const [hours, setHours] = useState(21)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(60)
  const [selectedStarId, setSelectedStarId] = useState('vega')
  const [showGrid, setShowGrid] = useState(true)
  const [showConstellations, setShowConstellations] = useState(false)
  const [viewRevision, setViewRevision] = useState(0)
  const [showAbout, setShowAbout] = useState(false)

  const selectedStar = STARS.find((star) => star.id === selectedStarId) ?? STARS[0]
  const observationDate = new Date(START_OF_DAY.getTime() + hours * 3_600_000)
  const position = equatorialToHorizontal(selectedStar.ra, selectedStar.dec, observationDate, latitude)
  const behavior = getDailyBehavior(selectedStar.dec, latitude)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setHours((value) => (value + speed / 600) % 24), 100)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  useEffect(() => {
    if (!showAbout) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowAbout(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showAbout])

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldnotes Sky home"><span className="brand-mark"><Compass size={21} strokeWidth={1.5} /></span><span className="brand-name">FIELDNOTES <i>·</i> SKY</span></a>
        <div className="topbar-meta"><span className="issue-tag">OBSERVATION 01</span><span className="topbar-divider" /><span>EARTH IN MOTION</span></div>
        <button className="icon-button help-button" type="button" aria-label="About this model" title="About this model" onClick={() => setShowAbout(true)}><span>?</span></button>
      </header>
      {showAbout && <div className="dialog-scrim" onClick={() => setShowAbout(false)}>
        <section className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={(event) => event.stopPropagation()}>
          <button className="dialog-close" type="button" onClick={() => setShowAbout(false)} aria-label="Close model notes"><X size={18} /></button>
          <p className="eyebrow">MODEL NOTES <span>/</span> 01</p>
          <h2 id="about-title">A fixed sky,<br />seen from a turning Earth.</h2>
          <p>Star positions use fixed right ascension and declination. UTC is converted to Greenwich mean sidereal time, then into local horizon coordinates.</p>
          <p>The observer is placed at longitude 0° (Greenwich). This model omits refraction, precession, proper motion, and atmospheric effects.</p>
          <span className="dialog-footnote">A teaching model, not a navigation instrument.</span>
        </section>
      </div>}

      <section className="intro-row" id="top">
        <div><p className="eyebrow">THE CELESTIAL SPHERE <span>/</span> DAILY MOTION</p><h1>A sky in motion.</h1></div>
        <p className="intro-note">The stars keep their places. Our turning Earth changes the view.</p>
      </section>

      <section className="workspace" aria-label="Interactive celestial sphere">
        <div className="observatory">
          <div className="scene-header"><div className="scene-location"><span className="live-dot" /> LOCAL SKY <b>{formatLatitude(latitude)}</b></div><div className="scene-coordinates"><span>N</span><span className="coordinate-line" /><span>E</span></div></div>
          <div className="sphere-wrap">
            <SphereView date={observationDate} latitude={latitude} selectedStarId={selectedStarId} showGrid={showGrid} showConstellations={showConstellations} constellationPairs={CONSTELLATION_PAIRS} resetToken={viewRevision} onSelectStar={setSelectedStarId} />
            <div className="sphere-caption sphere-caption-north"><span className="caption-rule" /> NORTH</div>
            <div className="sphere-caption sphere-caption-horizon">HORIZON <span>0°</span></div>
            <div className="scene-inset"><span className="inset-dot" /> CELESTIAL NORTH POLE <b>{Math.abs(latitude)}° {latitude < 0 ? 'BELOW' : 'ABOVE'} HORIZON</b></div>
          </div>
          <div className="scene-footer"><div className="scene-legend"><span className="legend-star" /> BRIGHT STARS <span className="legend-equator" /> CELESTIAL EQUATOR</div><button className="scene-reset" type="button" onClick={() => setViewRevision((value) => value + 1)} title="Reset sphere view" aria-label="Reset sphere view"><RotateCcw size={15} /><span>RESET VIEW</span></button></div>
          <div className="transport" aria-label="Time controls">
            <button className={`play-button ${playing ? 'is-playing' : ''}`} type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause time' : 'Play time'} title={playing ? 'Pause time' : 'Play time'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
            <div className="timeline"><div className="timeline-head"><span className="timeline-label">SIDEREAL CLOCK</span><output htmlFor="time-slider">{formatTime(hours)} <small>UTC</small></output></div><input id="time-slider" className="range-input time-range" type="range" min="0" max="24" step="0.01" value={hours} onChange={(event) => setHours(Number(event.target.value))} aria-label="Time of day in UTC" /><div className="range-ticks"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>
            <div className="speed-control" aria-label="Playback speed">{SPEEDS.map((option) => <button key={option} className={speed === option ? 'speed-option is-active' : 'speed-option'} type="button" aria-pressed={speed === option} onClick={() => setSpeed(option)}>{option}×</button>)}</div>
          </div>
        </div>

        <aside className="inspector" aria-label="Observation details">
          <section className="inspector-section observer-section">
            <div className="section-heading"><span>01</span><h2>Observer</h2></div>
            <div className="latitude-readout"><Crosshair size={17} /><strong>{formatLatitude(latitude)}</strong><span>LATITUDE</span></div>
            <label className="control-label" htmlFor="latitude-slider">Observer latitude</label>
            <input id="latitude-slider" className="range-input latitude-range" type="range" min="-90" max="90" step="1" value={latitude} onChange={(event) => setLatitude(Number(event.target.value))} />
            <div className="range-ticks latitude-ticks"><span>90° S</span><span>0°</span><span>90° N</span></div>
          </section>
          <section className="inspector-section star-section">
            <div className="section-heading"><span>02</span><h2>Selected star</h2></div>
            <div className="star-title"><span className="star-glyph" style={{ '--star-color': selectedStar.color } as CSSProperties}><Star size={17} fill="currentColor" /></span><h3>{selectedStar.name}</h3></div>
            <p className="star-subtitle">Bright star <span>·</span> apparent magnitude {selectedStar.magnitude.toFixed(2)}</p>
            <label className="star-picker" htmlFor="star-picker"><span>CHOOSE STAR</span><select id="star-picker" value={selectedStarId} onChange={(event) => setSelectedStarId(event.target.value)}>{STARS.map((star) => <option key={star.id} value={star.id}>{star.name}</option>)}</select></label>
            <div className="data-grid"><div><span>ALTITUDE</span><strong>{Math.round(position.altitude)}°</strong></div><div><span>AZIMUTH</span><strong>{Math.round(position.azimuth)}°</strong></div><div><span>RIGHT ASCENSION</span><strong>{(selectedStar.ra / 15).toFixed(2)}h</strong></div><div><span>DECLINATION</span><strong>{selectedStar.dec > 0 ? '+' : ''}{selectedStar.dec.toFixed(1)}°</strong></div></div>
            <div className={`behavior-note behavior-${behavior}`}><span className="behavior-mark" /><span>{behavior === 'circumpolar' ? 'Circumpolar at this latitude' : behavior === 'below-horizon' ? 'Below the horizon all day' : 'Rises and sets each day'}</span></div>
          </section>
          <section className="inspector-section layers-section">
            <div className="section-heading"><span>03</span><h2>Reference lines</h2></div>
            <label className="toggle-row"><span className="toggle-copy"><span>Altitude grid</span><small>Horizon coordinates</small></span><input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} /><span className="toggle-switch" aria-hidden="true" /></label>
            <label className="toggle-row"><span className="toggle-copy"><span>Star pattern</span><small>Summer Triangle</small></span><input type="checkbox" checked={showConstellations} onChange={(event) => setShowConstellations(event.target.checked)} /><span className="toggle-switch" aria-hidden="true" /></label>
          </section>
        </aside>
      </section>

      <section className="lesson-strip" aria-label="Astronomy notes">
        <article className="lesson-lead"><span className="lesson-index">FIELD NOTE <b>01</b></span><h2>Nothing is still<br />when Earth turns.</h2></article>
        <article className="lesson-item"><span className="lesson-number">01 <span>/ ROTATION</span></span><p>Earth spins eastward. The sky appears to drift the other way, completing a turn in <strong>23 hours 56 minutes.</strong></p></article>
        <article className="lesson-item"><span className="lesson-number">02 <span>/ YOUR HORIZON</span></span><p>Move north or south and the celestial pole follows. Stars trace new arcs against your horizon.</p></article>
        <article className="lesson-item lesson-last"><span className="lesson-number">03 <span>/ THIS STAR</span></span><p>{selectedStar.name} is <strong>{behavior === 'circumpolar' ? 'circumpolar' : behavior === 'below-horizon' ? belowHorizonCopy : 'rising and setting'}</strong> from {formatLatitude(latitude)}.</p></article>
      </section>
      <footer className="page-footer"><span>FIELDNOTES · SKY STUDY</span><span>FIXED STARS · IDEALIZED EARTH ROTATION · UTC</span></footer>
    </main>
  )
}

export default App
