import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@/i18n/navigation"
import { checkEmailExists } from "@/lib/data/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import z from "zod"

const EmailSchema = z.object({
    email: z.string().email(),
})

type EmailFields = z.infer<typeof EmailSchema>

export function EmailStep({
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
        <Card className="w-full max-w-md">
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
        </Card>
    )
}
