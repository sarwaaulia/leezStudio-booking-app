"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import api from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Loader2, Users, LogOut, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/login");
		}
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		queryClient.clear();
		toast.success("Logged out successfully");
		router.replace("/login");
	};

	const {
		data: bookingsData,
		isLoading,
	} = useQuery({
		queryKey: ["bookings"],
		queryFn: async () => {
			const res = await api.get("/admin/bookings");
			return res.data.data;
		},
		refetchInterval: 10000, 
		enabled: isMounted,
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

	const approveMutation = useMutation({
		mutationFn: (id: number) => api.patch(`/admin/bookings/${id}/approve`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookings"] });
			toast.success("Booking Approved!");
		},
		onError: () => toast.error("Failed to approve booking"),
	});

	const rejectMutation = useMutation({
		mutationFn: (id: number) => api.delete(`/admin/bookings/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookings"] });
			toast.info("Booking Rejected");
		},
		onError: () => toast.error("Failed to process request"),
	});

	const chartOptions = useMemo(
		() => ({
			chart: {
				type: "column",
				backgroundColor: "transparent",
				style: { fontFamily: "inherit" },
			},
			title: { text: "" },
			credits: { enabled: false },
			xAxis: {
				categories: Object.keys(studioStats),
				labels: { style: { color: "#4E342E", fontWeight: "bold" } },
			},
			yAxis: {
				title: { text: "Total Visitors" },
				min: 0,
				allowDecimals: false,
			},
			series: [
				{ name: "Confirmed Visitors", data: Object.values(studioStats) },
			],
			legend: { enabled: false },
			plotOptions: {
				column: {
					borderRadius: 8,
					colorByPoint: true,
					dataLabels: { enabled: true },
				},
			},
			colors: ["#795548", "#A1887F", "#D7CCC8"],
		}),
		[studioStats],
	);

	if (!isMounted || isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[#4E342E]" />
				{/* mengurangi cognititve load dan memberikan progres yang jelas selama proses data di ambil di server */}
				<span className="ml-2">Reloading data reservation...</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F5F5F5]">
			<nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
				<div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
					<div className="flex items-center gap-2">
						<div className="bg-[#795548] p-1.5 rounded-lg">
							<LayoutDashboard size={20} className="text-white" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-[#4E342E]">
							LeezStudio{" "}
							<span className="font-light text-gray-400">| Panel</span>
						</h1>
					</div>

					<div className="flex items-center gap-4">
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="ghost"
									className="text-gray-500 hover:text-red-600 hover:bg-red-50 gap-2"
								>
									<LogOut size={18} />
									<span className="hidden md:inline">Logout</span>
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Confirm Logout</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to end your session?
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleLogout}
										className="bg-red-600 hover:bg-red-700 text-white"
									>
										Logout
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			</nav>

			<main className="p-4 md:p-8 space-y-6 container mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Card className="border-none shadow-sm bg-white p-6">
						<h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
							Confirmed Customers
						</h3>
						<div className="space-y-4">
							{Object.entries(studioStats).map(([name, count]) => (
								<div
									key={name}
									className="flex items-center justify-between p-3 bg-[#FAF9F8] rounded-xl"
								>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-white rounded-lg shadow-sm text-[#795548]">
											<Users size={18} />
										</div>
										<span className="text-sm font-medium text-[#5D4037]">
											{name}
										</span>
									</div>
									<span className="text-2xl font-bold text-[#4E342E]">
										{count}
									</span>
								</div>
							))}
						</div>
					</Card>

					<Card className="lg:col-span-2 border-none shadow-sm bg-white p-4">
						<HighchartsReact highcharts={Highcharts} options={chartOptions} />
					</Card>
				</div>

				<Card className="border-none shadow-sm bg-white overflow-hidden">
					<Tabs defaultValue="PENDING" className="w-full">
						<div className="px-6 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#F5F5F5] pb-4">
							<div>
								<h2 className="text-lg font-bold text-[#4E342E]">
									Booking Management
								</h2>
								<p className="text-sm text-gray-500">
									Manage and monitor customer reservations
								</p>
							</div>
							<TabsList className="bg-[#F5F5F5]">
								<TabsTrigger
									value="PENDING"
									className="data-[state=active]:bg-white"
								>
									PENDING
								</TabsTrigger>
								<TabsTrigger
									value="CONFIRMED"
									className="data-[state=active]:bg-white"
								>
									APPROVED
								</TabsTrigger>
								<TabsTrigger
									value="CANCELLED"
									className="data-[state=active]:bg-white"
								>
									CANCELLED
								</TabsTrigger>
							</TabsList>
						</div>

						{["PENDING", "CONFIRMED", "CANCELLED"].map((status) => (
							<TabsContent key={status} value={status} className="m-0">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader className="bg-[#FAF9F8]">
											<TableRow>
												<TableHead className="w-[250px]">Customer</TableHead>
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
														className="text-center py-20 text-gray-400"
													>
														No bookings found for status: {status}
													</TableCell>
												</TableRow>
											) : (
												bookingsData
													?.filter((b: any) => b.Status === status)
													.map((booking: any) => (
														<TableRow
															key={booking.ID}
															className="hover:bg-gray-50/50"
														>
															<TableCell>
																<div className="flex flex-col">
																	<span className="font-bold text-[#4E342E]">
																		{booking.name}
																	</span>
																	<span className="text-xs text-gray-500 italic">
																		{booking.email}
																	</span>
																	<span className="text-[10px] text-gray-400 mt-1">
																		ID: {booking.ID}
																	</span>
																</div>
															</TableCell>
															<TableCell>
																<Badge
																	variant="secondary"
																	className="bg-[#D7CCC8]/30 text-[#4E342E] hover:bg-[#D7CCC8]/50 border-none"
																>
																	{booking.studio?.Name || "N/A"}
																</Badge>
															</TableCell>
															<TableCell>
																<div className="flex flex-col gap-1">
																	<span className="text-sm font-medium">
																		{booking.slot?.StartTime
																			? new Date(
																					booking.slot.StartTime,
																				).toLocaleDateString("id-ID", {
																					weekday: "long",
																					day: "numeric",
																					month: "short",
																				})
																			: "-"}
																	</span>
																	<div className="flex items-center gap-1 text-xs text-gray-500">
																		<Badge
																			variant="outline"
																			className="font-mono"
																		>
																			{formatTime(booking.slot?.StartTime)} -{" "}
																			{formatTime(booking.slot?.EndTime)}
																		</Badge>
																	</div>
																</div>
															</TableCell>
															<TableCell className="text-right">
																<ActionButtons
																	status={status}
																	id={booking.ID}
																	onApprove={approveMutation.mutate}
																	onReject={rejectMutation.mutate}
																	isLoading={
																		approveMutation.isPending ||
																		rejectMutation.isPending
																	}
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

function ActionButtons({ status, id, onApprove, onReject, isLoading }: any) {
	if (status === "PENDING") {
		return (
			<div className="flex justify-end gap-2">
				<ConfirmDialog
					trigger={
						<Button
							size="sm"
							variant="outline"
							disabled={isLoading}
							className="text-red-600 border-red-200 hover:bg-red-50"
						>
							Reject
						</Button>
					}
					title="Reject Booking?"
					description="This action will notify the customer and reopen the time slot."
					onConfirm={() => onReject(id)}
				/>
				<ConfirmDialog
					trigger={
						<Button
							size="sm"
							disabled={isLoading}
							className="bg-green-600 hover:bg-green-700 text-white"
						>
							Approve
						</Button>
					}
					title="Approve Booking?"
					description="Confirm this reservation. An email notification may be sent."
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
						variant="ghost"
						disabled={isLoading}
						className="text-gray-400 hover:text-red-500"
					>
						Cancel Booking
					</Button>
				}
				title="Cancel Approved Booking?"
				description="This will vacate the studio slot for this time."
				onConfirm={() => onReject(id)}
			/>
		);
	}

	return (
		<Badge className="bg-gray-100 text-gray-400 border-none shadow-none">
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
					<AlertDialogCancel>Back</AlertDialogCancel>
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
