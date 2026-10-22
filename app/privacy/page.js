export const metadata = {
  title: 'Privacy & Analytics',
  description: 'How OBEFREE uses optional website analytics and respects visitor consent.'
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function PrivacyPage() {
  return <main style={{background:'#f5f3ed',minHeight:'100vh',fontFamily:'Arial, sans-serif',color:'#172019'}}>
    <div style={{maxWidth:850,margin:'0 auto',padding:'44px 24px 100px'}}>
      <a href={`${basePath}/`} style={{fontWeight:900,fontSize:22,color:'inherit',textDecoration:'none'}}>OBEFREE.</a>
      <p style={{marginTop:60,color:'#5a665b',fontSize:12,letterSpacing:2,fontWeight:800}}>PRIVACY NOTICE · OBEFREE</p>
      <h1 style={{fontSize:'clamp(42px,7vw,74px)',lineHeight:1,letterSpacing:'-.05em',margin:'20px 0'}}>Your visit. Your choice.</h1>
      <p style={{fontSize:19,lineHeight:1.6}}>OBEFREE is an independent interactive design studio. This page explains how optional website analytics work.</p>
      <h2>Optional Google Analytics</h2>
      <p>When enabled, we use Google Analytics 4 (GA4) to understand which pages are visited and which topics people find useful. GA4 may use cookies or similar identifiers and process approximate location and device information. We do not intentionally send names, email addresses or other directly identifying contact information through analytics events. We do not enable advertising personalization in our tag configuration.</p>
      <h2>Consent</h2>
      <p>The analytics script is not loaded, and analytics measurements are not transmitted by our integration, unless you select “Accept analytics” in our consent notice. Choosing “Decline” does not prevent using the website. We store only your preference in your browser to remember your choice. You can change it using the “Privacy settings” button.</p>
      <h2>What we measure</h2>
      <p>After consent, the site can record page visits, usage of the interactive design demo, outbound project links and clicks on email contact links. A contact click does not mean that an email was actually sent. We use aggregate insights for site improvements and to evaluate our services.</p>
      <h2>Google&apos;s role and your rights</h2>
      <p>Google may process analytics data in countries outside the European Economic Area. Data handling, cookies and retention also depend on the settings of our Analytics property. You can request information about our processing and ask for access or deletion where applicable. Your browser may also offer cookie deletion controls.</p>
      <p>For details about how Google uses data, see <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google&apos;s privacy policy</a>.</p>
      <h2>Contact</h2>
      <p>For privacy questions, contact <a href="mailto:hello@obefree.com">hello@obefree.com</a>.</p>
      <p style={{borderTop:'1px solid #c6cfc0',paddingTop:20,marginTop:60,color:'#596458',fontSize:13}}>Last updated: October 22, 2026 · <a href={`${basePath}/gamification/`}>Applied Game Design</a></p>
    </div>
  </main>
}
