import { getEnabledOAuthProviders } from "@/lib/data/auth"
import LoginTemplate from "@/modules/auth/templates/login"

export default async function LoginPage() {
  const providers = await getEnabledOAuthProviders()
  return <LoginTemplate providers={providers} />
}
