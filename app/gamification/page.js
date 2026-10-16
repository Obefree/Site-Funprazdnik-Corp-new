'use client'

import { useState } from 'react'
import './landing.css'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const scenarios = {
  teams: {
    title: 'Turn team collaboration into a shared mission.',
    steps: ['Give everyone meaningful roles and abilities', 'Make collective decisions change the shared world', 'Reward progress through visible consequences'],
    signal: 'What to measure: participation, collaboration, decisions made'
  },
  learning: {
    title: 'Replace passive learning with consequential choices.',
    steps: ['Present a realistic problem, not a lecture', 'Let learners test hypotheses and discover outcomes', 'Use feedback, narrative and replay to build mastery'],
    signal: 'What to measure: demonstrated skills, completion, retention'
  },
  change: {
    title: 'Make a complex process understandable and motivating.',
    steps: ['Map the real incentives, resources and constraints', 'Build a playable model of actions and trade-offs', 'Iterate until the desired behavior emerges naturally'],
    signal: 'What to measure: adoption, quality of actions, meaningful outcomes'
  }
}

const services = [
  ['01','Game systems & incentive design','Progression, economies, roles, decision architecture and motivational loops for real processes.'],
  ['02','Live & hybrid experiences','Interactive broadcasts, shared digital spaces, audience-driven events, team quests and RPG-inspired facilitation.'],
  ['03','Serious games & learning','Training simulations, educational games and decision-based experiences for teams, schools and communities.'],
  ['04','Rapid prototyping & playtesting','From a workshop, cards or board-game prototype to an interactive browser-based proof of concept.']
]

const work = [
  {label:'DELIVERED EXPERIENCE / LIVE FORMAT',title:'Interactive broadcast worlds',body:'Live events in shared Miro environments where participants influence the space and shape the unfolding experience.',url:null},
  {label:'PROJECT EXPERIENCE / GAME DESIGN',title:'Team quests & custom RPG systems',body:'Role-playing structures, challenges, missions and collaborative narratives built for facilitated group experiences.',url:null},
  {label:'PRODUCT IN DEVELOPMENT / EDTECH',title:'Critical Mind',body:'Gamified critical-thinking and media-literacy applications built around source evaluation, decisions and feedback.',url:'https://criticalmind.obefree.com'},
  {label:'ORIGINAL GAME SYSTEM / TABLETOP',title:'Civilization RPG',body:'A generational role-playing system exploring time, resources, legacy and the growth of civilization.',url:'https://civ.obefree.com'}
]

function emailLink(subject) {
  return 'mailto:hello@obefree.com?subject=' + encodeURIComponent(subject)
}

export default function GamificationLanding() {
  const [selected, setSelected] = useState('teams')
  const active = scenarios[selected]
  return <main className="gmf" id="top">
    <nav className="gmf-nav gmf-wrap" aria-label="Primary navigation">
      <a className="gmf-logo" href={`${basePath}/`} aria-label="OBEFREE home">OBEFREE<span>.</span></a>
      <div className="gmf-navlinks">
        <a href="#services">Expertise</a>
        <a href="#work">Selected work</a>
        <a href="#approach">Approach</a>
        <a className="gmf-outline" href="#contact">Start a project ↗</a>
      </div>
    </nav>

    <section className="gmf-wrap gmf-hero">
      <div>
        <div className="gmf-chip">Applied game design studio · Slovenia / worldwide</div>
        <h1>Real problems.<br/><em>Playable</em><br/>systems.</h1>
        <p className="gmf-lead">We use the craft of game design to transform complex processes, live events and learning challenges into systems people want to explore, understand and act within.</p>
        <div className="gmf-actions">
          <a className="gmf-btn gmf-primary" href="#services">Explore our expertise <span aria-hidden="true">↗</span></a>
          <a className="gmf-btn gmf-secondary" href="#work">See what we make <span aria-hidden="true">↘</span></a>
        </div>
        <p className="gmf-hero-note">Strategy · Mechanics · Narrative · Facilitation · Interactive prototypes</p>
      </div>
      <div className="gmf-canvas" aria-label="Illustration showing how a shared system connects people, progress, resources and decisions">
        <div className="gmf-canvas-top"><span>SYSTEM DESIGN / FIELD NOTES</span><span className="gmf-live"><i/> LIVE MODEL</span></div>
        <div className="gmf-orbit">
          <div className="gmf-ring"/><div className="gmf-ring gmf-ring2"/>
          <div className="gmf-center">MAKE<br/>IT<br/>PLAYABLE</div>
          <div className="gmf-node gmf-n1"><small>INPUT / 01</small>PEOPLE</div>
          <div className="gmf-node gmf-n2"><small>INPUT / 02</small>CHOICES</div>
          <div className="gmf-node gmf-n3"><small>SYSTEM / 03</small>RULES</div>
          <div className="gmf-node gmf-n4"><small>OUTCOME / 04</small>CHANGE</div>
        </div>
        <div className="gmf-canvas-bottom"><span>THE GAME IS THE INTERFACE</span><span>01 → 04 / REPEAT</span></div>
      </div>
    </section>

    <section className="gmf-strip" aria-label="Studio experience">
      <div className="gmf-wrap gmf-statgrid">
        <div className="gmf-stat"><strong>15+ years</strong><span>Designing interactive experiences and gamification</span></div>
        <div className="gmf-stat"><strong>1,000+</strong><span>Events delivered and facilitated</span></div>
        <div className="gmf-stat"><strong>Physical + digital</strong><span>Board games, RPGs, live experiences and interactive products</span></div>
      </div>
    </section>

    <section className="gmf-section gmf-wrap" id="services">
      <div className="gmf-head"><span className="gmf-eyebrow">01 / What we do</span><div><h2>Not points and badges.<br/>Systems that work.</h2><p>We start from the underlying challenge: who makes decisions, what motivates them and what happens next. The result might be an interactive experience, a new workflow, a simulation or an entire game.</p></div></div>
      <div className="gmf-services">{services.map(([number,title,body])=><article className="gmf-service" key={number}><span className="gmf-service-no">{number} / EXPERTISE</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>

    <section className="gmf-section gmf-light" id="lab">
      <div className="gmf-wrap">
        <div className="gmf-head"><span className="gmf-eyebrow">02 / Think like a game designer</span><div><h2>Different challenge.<br/>Different rules.</h2><p>Pick a real-world goal and see how the game system changes. This is a simplified illustration of the way we think, not an off-the-shelf gamification formula.</p></div></div>
        <div className="gmf-lab">
          <div className="gmf-lab-select" role="group" aria-label="Choose a design challenge">
            <button type="button" onClick={()=>setSelected('teams')} aria-pressed={selected==='teams'} className={`gmf-choice ${selected==='teams'?'active':''}`}>Improve collaboration <span>↗</span></button>
            <button type="button" onClick={()=>setSelected('learning')} aria-pressed={selected==='learning'} className={`gmf-choice ${selected==='learning'?'active':''}`}>Make learning stick <span>↗</span></button>
            <button type="button" onClick={()=>setSelected('change')} aria-pressed={selected==='change'} className={`gmf-choice ${selected==='change'?'active':''}`}>Change behavior <span>↗</span></button>
          </div>
          <div className="gmf-example" aria-live="polite">
            <div className="gmf-example-label">PLAYABLE SYSTEM / DESIGN SKETCH</div>
            <h3>{active.title}</h3>
            <div className="gmf-steps">{active.steps.map((step,i)=><div className="gmf-step" key={step}><b>{String(i+1).padStart(2,'0')}</b><span>{step}</span></div>)}</div>
            <div className="gmf-example-foot">{active.signal}</div>
          </div>
        </div>
      </div>
    </section>

    <section className="gmf-section gmf-wrap" id="work">
      <div className="gmf-head"><span className="gmf-eyebrow">03 / Selected formats & work</span><div><h2>From shared spaces<br/>to invented worlds.</h2><p>Our work spans facilitated experiences, interactive broadcasts, RPG systems and learning products. We distinguish delivered formats from projects still in development.</p></div></div>
      <div className="gmf-work">{work.map(item=><article className="gmf-case" key={item.title}><small>{item.label}</small><h3>{item.title}</h3><p>{item.body}</p>{item.url?<a className="gmf-case-link" href={item.url} target="_blank" rel="noopener noreferrer">Explore project ↗</a>:<a className="gmf-case-link" href={emailLink('Request a portfolio example — '+item.title)}>Request an example ↗</a>}</article>)}</div>
    </section>

    <section className="gmf-section gmf-wrap" id="approach">
      <div className="gmf-head"><span className="gmf-eyebrow">04 / How we work</span><div><h2>Understand.<br/>Model. Playtest. Evolve.</h2><p>Game design is a way to test rules and behavior before expensive implementation. We prototype early, look for unintended incentives, and improve the system through real play.</p></div></div>
      <div className="gmf-process">
        <article><b>01 / DISCOVER</b><h3>Find the real problem</h3><p>Map people, behaviors, incentives, constraints and success measures.</p></article>
        <article><b>02 / DESIGN</b><h3>Build the rules</h3><p>Define player choices, progression, roles, resources and consequences.</p></article>
        <article><b>03 / TEST</b><h3>Make it playable</h3><p>Use workshops, tabletop prototypes or interactive proof-of-concepts.</p></article>
        <article><b>04 / EVOLVE</b><h3>Measure and refine</h3><p>Test the experience, balance mechanics and prepare implementation.</p></article>
      </div>
    </section>

    <section className="gmf-section gmf-wrap" id="partners">
      <div className="gmf-partner"><div><div className="gmf-eyebrow">For agencies, consultancies and studios</div><h3>Need an experienced game systems partner?</h3><p>We can join an existing team to design mechanics, build a rapid prototype, facilitate an interactive session or add RPG and game-economy expertise to a larger project.</p><a href={emailLink('OBEFREE — agency partnership')} className="gmf-btn gmf-secondary">Discuss collaboration ↗</a></div><div className="gmf-partner-list"><div><b>↗</b> White-label game design</div><div><b>↗</b> Freelance / project-based delivery</div><div><b>↗</b> Hybrid experience design</div><div><b>↗</b> Systems, economy and balance</div></div></div>
    </section>

    <section className="gmf-cta" id="contact">
      <div className="gmf-wrap"><div className="gmf-eyebrow">Ready to build something meaningful?</div><h2>Let's make your<br/>challenge playable.</h2><p>Tell us what you want to change, teach or explore. We'll work with you to find the right interactive format.</p><div className="gmf-actions"><a className="gmf-btn gmf-primary" href={emailLink('Let’s discuss an applied game design project')}>Start a conversation ↗</a><a className="gmf-btn gmf-secondary" style={{color:'#17211a',borderColor:'#788956'}} href="https://obefree.com/">Explore OBEFREE studio ↗</a></div></div>
    </section>

    <footer className="gmf-foot">
      <div className="gmf-wrap gmf-footrow"><a href={`${basePath}/`} className="gmf-logo">OBEFREE<span>.</span></a><div className="gmf-footlinks"><a href={`${basePath}/`}>Main studio</a><a href={`${basePath}/cv/`}>CV</a><a href="https://github.com/Obefree">GitHub</a><a href="mailto:hello@obefree.com">Email</a><a href="#top">Back to top ↑</a></div></div>
      <div className="gmf-wrap gmf-disclaimer">Independent applied game design studio · Slovenia / Remote · © 2026 OBEFREE</div>
    </footer>
  </main>
}
