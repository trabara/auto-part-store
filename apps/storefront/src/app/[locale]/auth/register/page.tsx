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
import { checkEmailExists, registerCustomer } from "@/lib/data/auth"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"

// ── Schemas ─────────────────────────────────────────────────────────────────

const EmailSchema = z.object({
  email: z.string().email(),
})
type EmailFields = z.infer<typeof EmailSchema>

const GuestSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8),
})
type GuestFields = z.infer<typeof GuestSchema>

const NewSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  password: z.string().min(8),
})
type NewFields = z.infer<typeof NewSchema>

// ── Types ────────────────────────────────────────────────────────────────────

type Step =
  | { name: "email" }
  | { name: "guest"; firstName: string; lastName: string }
  | { name: "new" }

// ── Sub-forms ────────────────────────────────────────────────────────────────

function EmailStep({
  onGuest,
  onNew,
  onRegistered,
}: {
  onGuest: (email: string, firstName: string, lastName: string) => void
  onNew: (email: string) => void
  onRegistered: () => void
}) {
  const t = useTranslations("auth")
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailFields>({ resolver: zodResolver(EmailSchema) })

  async function onSubmit(data: EmailFields) {
    try {
      const result = await checkEmailExists(data.email)
      if (result.status === "registered") {
        onRegistered()
      } else if (result.status === "guest") {
        onGuest(data.email, result.first_name ?? "", result.last_name ?? "")
      } else {
        onNew(data.email)
      }
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : t("register.failed"),
      })
    }
  }

  return (
    <>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {t("register.title")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("register.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t("register.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("register.emailPlaceholder")}
              aria-invalid={!!errors.email}
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          {errors.root && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errors.root.message}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? t("register.checkingEmail")
              : t("register.continueButton")}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-center text-muted-foreground w-full">
          {t("register.haveAccount")}{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium"
          >
            {t("register.signIn")}
          </Link>
        </div>
      </CardFooter>
    </>
  )
}

function GuestStep({
  email,
  firstName: defaultFirstName,
  lastName: defaultLastName,
  onBack,
}: {
  email: string
  firstName: string
  lastName: string
  onBack: () => void
}) {
  const t = useTranslations("auth")
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GuestFields>({
    resolver: zodResolver(GuestSchema),
    defaultValues: { firstName: defaultFirstName, lastName: defaultLastName },
  })

  async function onSubmit(data: GuestFields) {
    try {
      await registerCustomer({
        email,
        password: data.password,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phone: data.phone || undefined,
      })
      router.push("/account")
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : t("register.failed"),
      })
    }
  }

  return (
    <>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {t("register.welcomeBack", { name: defaultFirstName || email })}
        </CardTitle>
        <CardDescription className="text-center">
          {t("register.setPasswordDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("register.firstName")}</Label>
              <Input
                id="firstName"
                placeholder={t("register.firstNamePlaceholder")}
                aria-invalid={!!errors.firstName}
                disabled={isSubmitting}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("register.lastName")}</Label>
              <Input
                id="lastName"
                placeholder={t("register.lastNamePlaceholder")}
                aria-invalid={!!errors.lastName}
                disabled={isSubmitting}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              {t("register.phone")}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("register.optional")})
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("register.phonePlaceholder")}
              disabled={isSubmitting}
              {...register("phone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("register.setPassword")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("register.passwordPlaceholder")}
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
            {isSubmitting
              ? t("register.creating")
              : t("register.createAccount")}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-center text-muted-foreground hover:underline w-full"
        >
          {t("register.back")}
        </button>
      </CardFooter>
    </>
  )
}

function NewStep({ email, onBack }: { email: string; onBack: () => void }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewFields>({ resolver: zodResolver(NewSchema) })

  async function onSubmit(data: NewFields) {
    try {
      await registerCustomer({
        email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      })
      router.push("/account")
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : t("register.failed"),
      })
    }
  }

  return (
    <>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {t("register.title")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("register.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("register.firstName")}</Label>
              <Input
                id="firstName"
                placeholder={t("register.firstNamePlaceholder")}
                aria-invalid={!!errors.firstName}
                disabled={isSubmitting}
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("register.lastName")}</Label>
              <Input
                id="lastName"
                placeholder={t("register.lastNamePlaceholder")}
                aria-invalid={!!errors.lastName}
                disabled={isSubmitting}
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-display">{t("register.email")}</Label>
            <Input
              id="email-display"
              value={email}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("register.password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("register.passwordPlaceholder")}
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
          <div className="space-y-2">
            <Label htmlFor="phone">
              {t("register.phone")}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("register.optional")})
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("register.phonePlaceholder")}
              disabled={isSubmitting}
              {...register("phone")}
            />
          </div>
          {errors.root && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errors.root.message}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? t("register.creating")
              : t("register.createAccount")}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-center text-muted-foreground hover:underline w-full"
        >
          {t("register.back")}
        </button>
      </CardFooter>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>({ name: "email" })
  const [email, setEmail] = useState("")

  function handleGuest(email: string, firstName: string, lastName: string) {
    setEmail(email)
    setStep({ name: "guest", firstName, lastName })
  }

  function handleNew(email: string) {
    setEmail(email)
    setStep({ name: "new" })
  }

  function handleRegistered() {
    router.push("/auth/login?message=account_exists")
  }

  function handleBack() {
    setStep({ name: "email" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        {step.name === "email" && (
          <EmailStep
            onGuest={(email, fn, ln) => handleGuest(email, fn, ln)}
            onNew={handleNew}
            onRegistered={handleRegistered}
          />
        )}
        {step.name === "guest" && (
          <GuestStep
            email={email}
            firstName={step.firstName}
            lastName={step.lastName}
            onBack={handleBack}
          />
        )}
        {step.name === "new" && <NewStep email={email} onBack={handleBack} />}
      </Card>
    </div>
  )
}
