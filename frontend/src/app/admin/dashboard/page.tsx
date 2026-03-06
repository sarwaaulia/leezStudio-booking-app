"use client";

import { useState, useMemo } from "react";
import api from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Loader2, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

const formatTime = (timeStr: string) => {
	if (!timeStr) return "--:--";
	const date = new Date(timeStr);
	return date.toLocaleTimeString("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

export default function AdminDashboard() {
	const queryClient = useQueryClient();

	const router = useRouter();

	const handleLogout = () => {
		localStorage.removeItem("token");
		queryClient.clear();
		toast.success("Logged out successfully");
		router.push("/login");
	};
    const isAuthenticated = typeof window !== "undefined" && !!localStorage.getItem("token")

	const { data: bookingsData, isLoading } = useQuery({
		queryKey: ["bookings"],
		queryFn: async () => {
			const res = await api.get("/admin/bookings");
			return res.data.data;
		},
		refetchInterval: 5000,
	});

	const studioStats = useMemo(() => {
		const stats: Record<string, number> = {
			"Studio Ei": 0,
			"Studio Bi": 0,
			"Studio Si": 0,
		};

		if (!bookingsData) return stats;

		bookingsData.forEach((b: any) => {
			if (b.Status === "CONFIRMED") {
				const rawName = b.studio?.Name || "";
				if (rawName.includes("Ei")) stats["Studio Ei"] += 1;
				else if (rawName.includes("Bi")) stats["Studio Bi"] += 1;
				else if (rawName.includes("Si")) stats["Studio Si"] += 1;
			}
		});
		return stats;
	}, [bookingsData]);

	// admin approve booking
	const approveMutation = useMutation({
		mutationFn: (id: number) => api.patch(`/admin/bookings/${id}/approve`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookings"] });
			toast.success("Booking Approved!");
		},
	});

	// booking cancel
	const rejectMutation = useMutation({
		mutationFn: (id: number) => api.delete(`/admin/bookings/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookings"] });
			toast.info("Booking Cancelled");
		},
	});

	const chartOptions = useMemo(
		() => ({
			chart: { type: "column", backgroundColor: "transparent" },
			title: { text: "" },
			xAxis: {
				categories: Object.keys(studioStats),
				labels: { style: { color: "#4E342E", fontWeight: "bold" } },
			},
			yAxis: {
				title: { text: "Total Visitors" },
				min: 0,
				allowDecimals: false,
			},
			series: [{ name: "Visitors", data: Object.values(studioStats) }],
			legend: { enabled: false },
			plotOptions: {
				column: {
					borderRadius: 5,
					colorByPoint: true,
					dataLabels: { enabled: true },
				},
			},
			colors: ["#795548", "#A1887F", "#D7CCC8"],
		}),
		[studioStats],
	);

	if (isLoading)
		return (
			<div className="flex h-screen w-full items-center justify-center bg-[#F5F5F5]">
				<Loader2 className="h-10 w-10 animate-spin text-[#4E342E]" />
			</div>
		);

	return (
		<div className="min-h-screen bg-[#F5F5F5]">
			{/* navbar */}
			<nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
				<div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
					{/* logo */}
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tighter text-[#795548] drop-shadow-md">
							LeezStudio
						</h1>
					</div>

					{/* navigation */}
					<div className="hidden md:flex items-center gap-6">
						<Link
							href="/admin/dashboard"
							className="flex items-center gap-2 text-sm font-medium text-[#4E342E]"
						>
							Dashboard
						</Link>

						{isAuthenticated ? (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="outline"
										className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
									>
										<LogOut size={16} /> Logout
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Logout confirmation</AlertDialogTitle>
										<AlertDialogDescription>
											You want to logged out?
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleLogout}
											className="bg-red-600 hover:bg-red-700"
										>
											Yes
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						) : (
							<Link href="/login">
								<Button className="bg-[#4E342E] hover:bg-[#3E2A25]">
									Login
								</Button>
							</Link>
						)}
					</div>
				</div>
			</nav>

			<main className="p-4 md:p-8 space-y-6 container mx-auto">
				<Card className="border-none shadow-sm bg-white overflow-hidden">
					<CardContent className="p-0">
						<div className="flex flex-col md:flex-row">
							<div className="p-6 md:w-1/3 border-r border-[#F5F5F5] space-y-4">
								<h3 className="text-lg font-bold text-[#4E342E]">
									Number of Customer
								</h3>
								<div className="space-y-6 pt-4">
									{Object.entries(studioStats).map(([name, count]) => (
										<div
											key={name}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-3">
												<div className="p-2 bg-[#F5F5F5] rounded-lg">
													<Users size={18} className="text-[#4E342E]" />
												</div>
												<span className="text-sm font-medium text-[#5D4037]">
													{name}
												</span>
											</div>
											<span className="text-xl font-bold text-[#4E342E]">
												{count}
											</span>
										</div>
									))}
								</div>
							</div>
							<div className="p-6 md:w-2/3 bg-[#FAF9F8]">
								<HighchartsReact
									highcharts={Highcharts}
									options={chartOptions}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* table list booking */}
				<Card className="border-none shadow-sm bg-white overflow-hidden">
					<Tabs defaultValue="PENDING" className="w-full">
						<div className="px-6 pt-6 flex justify-between items-center border-b border-[#F5F5F5]">
							<TabsList className="bg-[#F5F5F5] mb-2">
								<TabsTrigger value="PENDING">PENDING</TabsTrigger>
								<TabsTrigger value="CONFIRMED">APPROVED</TabsTrigger>
								<TabsTrigger value="CANCELLED">CANCELLED</TabsTrigger>
							</TabsList>
						</div>

						{["PENDING", "CONFIRMED", "CANCELLED"].map((status) => (
							<TabsContent key={status} value={status}>
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Customer</TableHead>
												<TableHead>Studio</TableHead>
												<TableHead>Schedule</TableHead>
												<TableHead className="text-right">Action</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{bookingsData?.filter((b: any) => b.Status === status)
												.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={4}
														className="text-center py-10 text-gray-400"
													>
														No data found
													</TableCell>
												</TableRow>
											) : (
												bookingsData
													?.filter((b: any) => b.Status === status)
													.map((booking: any) => (
														<TableRow key={booking.ID}>
															<TableCell>
																<p className="font-bold">{booking.name}</p>
																<p className="text-xs text-gray-500">
																	{booking.email}
																</p>
															</TableCell>
															<TableCell>{booking.studio?.Name}</TableCell>
															<TableCell>
																<Badge variant="outline">
																	{formatTime(booking.slot?.StartTime)} -{" "}
																	{formatTime(booking.slot?.EndTime)}
																</Badge>
															</TableCell>
															<TableCell className="text-right">
																<ActionButtons
																	status={status}
																	id={booking.ID}
																	onApprove={approveMutation.mutate}
																	onReject={rejectMutation.mutate}
																/>
															</TableCell>
														</TableRow>
													))
											)}
										</TableBody>
									</Table>
								</div>
							</TabsContent>
						))}
					</Tabs>
				</Card>
			</main>
		</div>
	);
}

function ActionButtons({ status, id, onApprove, onReject }: any) {
	if (status === "PENDING") {
		return (
			<div className="flex justify-end gap-2">
				<ConfirmDialog
					trigger={
						<Button
							size="sm"
							variant="outline"
							className="text-red-600 border-red-200"
						>
							Reject
						</Button>
					}
					title="Are you sure want to reject this booking?"
					description="This will reject the booking and make the slot available again."
					onConfirm={() => onReject(id)}
				/>
				<ConfirmDialog
					trigger={
						<Button
							size="sm"
							className="bg-green-600 hover:bg-green-700 text-white"
						>
							Approve
						</Button>
					}
					title="Are you sure want to approve this booking?"
					description="This will confirm the reservation and notify the customer."
					onConfirm={() => onApprove(id)}
				/>
			</div>
		);
	}

	if (status === "CONFIRMED") {
		return (
			<ConfirmDialog
				trigger={
					<Button
						size="sm"
						variant="outline"
						className="text-red-500 border-red-200"
					>
						Cancel Booking
					</Button>
				}
				title="Cancel Approved Booking?"
				description="The slot will be reopened for other customers."
				onConfirm={() => onReject(id)}
			/>
		);
	}

	return (
		<Badge variant="secondary" className="bg-[#F5F5F5]">
			Archived
		</Badge>
	);
}

function ConfirmDialog({ trigger, title, description, onConfirm }: any) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent className="bg-white border-none shadow-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-[#4E342E]">
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="border-[#D7CCC8]">
						Back
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-[#4E342E] text-white hover:bg-[#3E2723]"
					>
						Confirm
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
