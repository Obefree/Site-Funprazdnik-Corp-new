import { NextResponse } from 'next/server'

export function middleware(request) {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl
  if (host.startsWith('cv.') && !pathname.startsWith('/cv')) {
    const url = request.nextUrl.clone()
    url.pathname = `/cv${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] }
