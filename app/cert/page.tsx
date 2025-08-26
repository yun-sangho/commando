import { redirect } from 'next/navigation';

// NOTE: 단독 /cert 경로 접근 시 /wallet/cert 로 리다이렉트하여
// wallet layout (고정 width + 확대) 을 항상 유지합니다.
export default function CertRedirectPage() {
  redirect('/wallet/cert');
}
