import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import { login } from "@/lib/data/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import z from "zod"

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

type LoginFields = z.infer<typeof LoginSchema>

export default function LoginForm() {
    const t = useTranslations("auth")
    const router = useRouter()

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFields>({
        resolver: zodResolver(LoginSchema),
    })

    const onSubmit = async (data: LoginFields) => {
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
    )
}