import { getEnabledOAuthProviders } from "@/lib/data/auth"
import LoginForm from "./form"

export default async function LoginPage() {
  const providers = await getEnabledOAuthProviders()
  return <LoginForm providers={providers} />
}
