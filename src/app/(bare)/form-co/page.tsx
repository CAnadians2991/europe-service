import { SmmPage, smmMetadata } from '@/components/smm/SmmPage'

const PATH = '/form-co'
export const metadata = smmMetadata(PATH)
export default function Page() {
  return <SmmPage path={PATH} />
}
