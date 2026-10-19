import { SmmPage, smmMetadata } from '@/components/smm/SmmPage'

const PATH = '/form-rivne'
export const metadata = smmMetadata(PATH)
export default function Page() {
  return <SmmPage path={PATH} />
}
