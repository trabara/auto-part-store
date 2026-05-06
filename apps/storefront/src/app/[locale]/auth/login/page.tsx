"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { login } from "@/lib/data/auth"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginFields = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(LoginSchema),
  })

  async function onSubmit(data: LoginFields) {
    try {
      await login({ email: data.email, password: data.password })
      router.push("/account")
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : t("login.failed"),
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("login.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("login.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message === "account_exists" && (
            <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 p-3 rounded-md mb-4">
              {t("login.accountExists")}
            </div>
          )}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                aria-invalid={!!errors.password}
                disabled={isSubmitting}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errors.root && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {errors.root.message}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("login.signingIn") : t("login.signIn")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-medium"
            >
              {t("login.createAccount")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
