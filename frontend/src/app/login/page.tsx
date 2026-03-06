"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
	const [formData, setFormData] = useState({ name: "", email: "", password: "" });
	const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false)

	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
        setIsLoading(true);
        setError("");

		try {
			const response = await api.post("/login", formData);
			localStorage.setItem("token", response.data.token);

			toast.success("Login successful!", {
				description: "Welcome back.",
			});

			router.push("/admin/dashboard");
		} catch (err: any) {
			const errMsg = err.response?.data?.error || "Login failed";
			setError(errMsg);

			toast.error("Authentication Error", {
				description: errMsg,
			});

            setFormData({ name: "", email: "", password: "" });
		} finally {
            if (error) setIsLoading(false)
            setIsLoading(false)
        }
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] p-4">
			<Card className="w-full max-w-md border-none shadow-lg bg-[#D7CCC8]">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold text-[#4E342E]">
						Login
					</CardTitle>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
								{error}
							</p>
						)}

                        <div className="space-y-1">
							<Label htmlFor="name" className="text-[#4E342E]">
								Name
							</Label>
							<Input
                                value={formData.name}
								id="name"
								className="bg-white border-[#BCAAA4]"
								placeholder="John Doe"
								required
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
                                disabled={isLoading}
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="email" className="text-[#4E342E]">
								Email
							</Label>
							<Input
                                value={formData.email}
								id="email"
								type="email"
								className="bg-white border-[#BCAAA4]"
								placeholder="email@contoh.com"
								required
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
                                disabled={isLoading}
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="password" className="text-[#4E342E]">
								Password
							</Label>
							<Input
                                value={formData.password}
								id="password"
								type="password"
								className="bg-white border-[#BCAAA4]"
								placeholder="Enter your password"
								required
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
                                disabled={isLoading}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4 mt-5">
						<Button
                            type="submit"
                            className="w-full bg-[#4E342E] hover:bg-[#3E2723] text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>
						<p className="text-sm text-[#4E342E]">
							Don&apos;t have an account?{" "}
							<Link
								href="/register"
								className="underline font-bold text-[#795548] hover:text-[#4E342E]"
							>
								Register
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
