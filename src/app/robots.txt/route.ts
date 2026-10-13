import { robotsRules } from '@/lib/robots-rules'
import { robotsTxt } from '@/lib/route-data'

export const dynamic = 'force-static'

export function GET() {
  return new Response(robotsTxt(robotsRules()), { headers: { 'content-type': 'text/plain' } })
}
