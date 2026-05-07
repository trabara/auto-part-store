import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import { registerCustomer } from "@/lib/data/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import z from "zod"

const GuestSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(8),
})
type GuestFields = z.infer<typeof GuestSchema>

export default function GuestStep({
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
        <Card className="w-full max-w-md">
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
        </Card>
    )
}