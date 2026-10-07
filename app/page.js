const projects = [
  {name:'Infernal Skewer', tag:'3D PARTY GAME', desc:'Competitive arena cooking where a skewer is weapon, inventory and recipe.', href:'https://infernal.obefree.com', accent:'hot'},
  {name:'3D / VR AI Companion', tag:'AI · WEBXR', desc:'Embodied AI assistant that can see, act and build with you in a shared 3D space.', href:'https://avatar.obefree.com', accent:'violet'},
  {name:'Critical Mind', tag:'EDTECH', desc:'Gamified critical-reading and media-literacy training for young people.', href:'https://criticalmind.obefree.com', accent:'mint'},
  {name:'RecoTune', tag:'MUSIC TOOL', desc:'A practical tuner and learning tool with playable reference notes.', href:'https://recotune.obefree.com', accent:'blue'},
  {name:'Civilization RPG', tag:'TABLETOP SYSTEM', desc:'Generational role-playing where time, legacy and civilization growth become game mechanics.', href:'https://civ.obefree.com', accent:'amber'},
  {name:'StopKadr', tag:'EXPERIMENT', desc:'Interactive media project exploring attention, framing and interpretation.', href:'https://stopkadr.obefree.com', accent:'rose'},
  {name:'Dice Draft', tag:'TACTICAL CARD GAME', desc:'Two-player drafting and tactical combat built around a shared public dice pool.', href:'https://dice-draft-mobile.obefree.chatgpt.site/', accent:'mint'},
  {name:'Call of Blades', tag:'CARD BATTLE GAME', desc:'Digital card battler with AI play, card database and deck simulation tools.', href:'https://obefree.github.io/Cob-Game-Clean-v.1/', accent:'amber'}
]

export default function Home(){
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return <main>
    <nav className="nav shell"><a className="brand" href={`${basePath}/`}>OBEFREE<span>.</span></a><div className="navlinks"><a href="#work">Work</a><a href="#what">What we do</a><a href={`${basePath}/cv/`}>CV</a><a className="pill" href="mailto:hello@obefree.com">Contact</a></div></nav>
    <section className="hero shell">
      <div className="eyebrow">INDEPENDENT INTERACTIVE STUDIO · SLOVENIA / REMOTE</div>
      <h1>We turn systems<br/>into <em>play.</em></h1>
      <p className="lead">Games, gamification, educational tools and experimental AI interfaces — built around mechanics that people can understand, explore and enjoy.</p>
      <div className="actions"><a className="primary" href="#work">Explore projects ↘</a><a className="secondary" href={`${basePath}/cv/`}>Aleks Veselov — CV ↗</a></div>
      <div className="orbit"><span>GAME SYSTEMS</span><span>AI / XR</span><span>EDTECH</span><span>GAMIFICATION</span></div>
    </section>
    <section id="what" className="section shell">
      <div className="sectionhead"><span>01 / WHAT WE DO</span><h2>Small studio.<br/>Wide playground.</h2></div>
      <div className="services">
        <article><b>Game systems</b><p>Mechanics, combat, balance, economies, progression and rapid playable prototypes.</p></article>
        <article><b>Gamification</b><p>Onboarding, engagement loops, learning systems and interactive experiences for teams and products.</p></article>
        <article><b>AI + interactive</b><p>Browser-first experiments with embodied AI, voice, 3D environments and XR.</p></article>
        <article><b>Education</b><p>Learning-by-doing tools that replace passive explanations with decisions, feedback and play.</p></article>
      </div>
    </section>
    <section id="work" className="section projectsWrap"><div className="shell"><div className="sectionhead"><span>02 / SELECTED WORK</span><h2>Projects in motion.</h2></div><div className="projects">{projects.map((p,i)=><a key={p.name} className={`project ${p.accent}`} href={p.href}><div className="num">0{i+1}</div><div><small>{p.tag}</small><h3>{p.name}</h3><p>{p.desc}</p></div><div className="arrow">↗</div></a>)}</div></div></section>
    <section className="about shell"><div className="sectionhead"><span>03 / WHO</span><h2>Built by people who like complicated things made playable.</h2></div><div className="aboutgrid"><p className="bigcopy">Obefree is an independent studio led by <strong>Aleks Veselov</strong> — game systems designer, gamification specialist and prototype builder with a background spanning tabletop games, live experiences, mobile products and interactive systems.</p><div className="facts"><div><strong>15+ years</strong><span>games & interactive experiences</span></div><div><strong>1000+</strong><span>live events & facilitated experiences</span></div><div><strong>Physics → systems</strong><span>analytical design, balance & mechanics</span></div></div></div></section>
    <footer><div className="shell footergrid"><div><div className="brand">OBEFREE<span>.</span></div><p>Games · Gamification · AI · Education</p></div><div><a href={`${basePath}/cv/`}>CV</a><a href="https://github.com/Obefree">GitHub</a><a href="mailto:hello@obefree.com">hello@obefree.com</a></div></div></footer>
  </main>
}
