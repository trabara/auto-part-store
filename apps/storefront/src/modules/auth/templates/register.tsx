'use client'

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { EmailStep } from "../components/email-step";
import GuestStep from "../components/guest-step";
import { NewStep } from "../components/new-step";

type RegisterStep =
    | { name: "email" }
    | { name: "guest"; firstName: string; lastName: string }
    | { name: "new" }

export default function RegisterTemplate() {
    const router = useRouter()
    const [step, setStep] = useState<RegisterStep>({ name: "email" })
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

    if (step.name === "guest") {
        return (
            <GuestStep
                email={email}
                firstName={step.firstName}
                lastName={step.lastName}
                onBack={handleBack}
            />
        )
    }

    if (step.name === "new") {
        return <NewStep email={email} onBack={handleBack} />
    }

    return (
        <EmailStep
            onGuest={handleGuest}
            onNew={handleNew}
            onRegistered={handleRegistered}
        />
    )
}