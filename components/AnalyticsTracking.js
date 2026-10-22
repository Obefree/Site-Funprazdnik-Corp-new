'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * GA4 is opt-in only. No Google analytics code is fetched or data sent before
 * the visitor expressly accepts analytics cookies (basic consent mode).
 *
 * Configure NEXT_PUBLIC_GA_MEASUREMENT_ID in the build environment.
 * Do NOT add a Google Analytics API secret to frontend code.
 */
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
const ENABLED = /^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)
const CONSENT_KEY = 'obefree.analytics.v1'

function initializeAnalytics() {
  if (!ENABLED || typeof window === 'undefined') return
  if (!window.dataLayer) window.dataLayer = []
  if (!window.gtag) {
    window.gtag = function () { window.dataLayer.push(arguments) }
  }

  if (!window.__obefreeAnalyticsInitialized) {
    window.__obefreeAnalyticsInitialized = true

    // Consent mode v2. Advertising storage and personalization remain disabled.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    })
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
    window.gtag('js', new Date())
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    })

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID)
    document.head.appendChild(script)
  } else {
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
  }
}

function track(name, params) {
  if (typeof window !== 'undefined' && window.gtag &&
      window.localStorage.getItem(CONSENT_KEY) === 'accepted') {
    window.gtag('event', name, params || {})
  }
}

export default function AnalyticsTracking() {
  const pathname = usePathname()
  const [choice, setChoice] = useState(null)
  const [settingsVisible, setSettingsVisible] = useState(false)

  useEffect(() => {
    if (!ENABLED) return
    let saved = null
    try { saved = window.localStorage.getItem(CONSENT_KEY) } catch {}
    if (saved === 'accepted' || saved === 'declined') setChoice(saved)
    else setChoice('unanswered')
  }, [])

  useEffect(() => {
    if (!ENABLED || choice !== 'accepted') return
    initializeAnalytics()
    const pagePath = window.location.pathname
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath
    })
  }, [choice, pathname])

  useEffect(() => {
    if (!ENABLED || choice !== 'accepted') return
    function onClick(event) {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest('[data-obefree-event]')
      if (button) {
        const value = button.getAttribute('data-obefree-event')
        if (value === 'demo_interaction') {
          track('demo_interaction', {
            demo_choice: button.getAttribute('data-demo-choice') || 'unspecified'
          })
        }
      }
      const link = target.closest('a[href]')
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (href.startsWith('mailto:')) {
        // Clicking an email link shows intent, NOT that a lead was actually sent.
        track('contact_click', {contact_method: 'email', page_path: window.location.pathname})
      } else if (/^https?:\/\//i.test(href)) {
        try {
          const url = new URL(href, window.location.href)
          if (url.hostname !== window.location.hostname) {
            track('external_project_click', {destination_host: url.hostname})
          }
        } catch {}
      }
    }
    document.addEventListener('click', onClick, {capture: true})
    return () => document.removeEventListener('click', onClick, {capture: true})
  }, [choice])

  if (!ENABLED || choice === null) return null

  function saveChoice(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value) } catch {}
    if (value === 'declined' && window.gtag) {
      window.gtag('consent', 'update', {analytics_storage: 'denied'})
    }
    setChoice(value)
    setSettingsVisible(false)
  }

  const showBanner = choice === 'unanswered' || settingsVisible

  return <>
    {showBanner ? <div
      role="region"
      aria-label="Analytics privacy preferences"
      style={{position:'fixed',zIndex:9999,bottom:16,left:16,right:16,margin:'0 auto',
        maxWidth:640,background:'#161e19',color:'#f5f3e9',border:'1px solid #839180',
        borderRadius:14,padding:'20px 22px',boxShadow:'0 15px 55px #0008',
        fontFamily:'Arial,sans-serif'}}>
      <div style={{fontWeight:800,fontSize:17,marginBottom:9}}>Optional website analytics</div>
      <p style={{fontSize:14,lineHeight:1.5,margin:'0 0 13px'}}>
        May we use Google Analytics to measure visits and understand which projects interest you?
        This is optional. We do not load Google Analytics before your consent.
        Learn more in our <a href={(process.env.NEXT_PUBLIC_BASE_PATH || '') + '/privacy/'} style={{color:'#daf277',textDecoration:'underline'}}>privacy notice</a>.
      </p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button type="button" onClick={()=>saveChoice('accepted')} style={{background:'#dbf47c',color:'#152016',border:0,borderRadius:8,padding:'10px 16px',fontWeight:800,cursor:'pointer'}}>Accept analytics</button>
        <button type="button" onClick={()=>saveChoice('declined')} style={{background:'transparent',color:'#f5f3e9',border:'1px solid #829083',borderRadius:8,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>Decline</button>
      </div>
    </div> : <button
      type="button" title="Change analytics privacy choice"
      aria-label="Analytics privacy settings"
      onClick={()=>setSettingsVisible(true)}
      style={{position:'fixed',bottom:12,left:12,zIndex:9998,fontFamily:'Arial,sans-serif',
        fontSize:11,border:'1px solid #8b968b',borderRadius:20,padding:'7px 11px',
        background:'#1b251e',color:'#e2e9d9',cursor:'pointer'}}>
      Privacy settings
    </button>}
  </>
}
