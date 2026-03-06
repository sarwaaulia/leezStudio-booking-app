"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
import {
	Calendar as CalendarIcon,
	Loader2,
	X,
	History,
	CheckCircle,
	Clock,
} from "lucide-react";
import { format, isSameDay, startOfToday } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";

const colors = {
	primary: "#4E342E",
	secondary: "#A1887F",
	background: "#FAF9F8",
	accent: "#D7CCC8",
};

const studios = [
	{
		id: 1,
		name: "Studio Ei - Classic",
		price: 135000,
		description:
			"A studio to capture your moments either alone or with friends with a spotlight theme in various colors that matches the current photo trend and looks classy.",
		image: "/download.jpg",
	},
	{
		id: 2,
		name: "Studio Bi - Vintage",
		price: 250000,
		description:
			"The studio with a vintage theme is equipped with balloon decorations, one of which is a number balloon, very suitable for capturing moments alone or with loved ones.",
		image: "/download (1).jpg",
	},
	{
		id: 3,
		name: "Studio Si - Minimalist",
		price: 340000,
		description:
			"Minimalist studio with a clean white vibe that is suitable for capturing moments such as maternity or extended family photos.",
		image: "/Self Photo Maternity.jpg",
	},
];

function BookingContent() {
	const [selectedStudio, setSelectedStudio] = useState<any>(null);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [availableSlots, setAvailableSlots] = useState([]);
	const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const [trackData, setTrackData] = useState({ phone: "", id: "" });
	const [bookingHistory, setBookingHistory] = useState<any>(null);
	const [form, setForm] = useState({ name: "", email: "", phone: "" });

	const params = useSearchParams();

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		if (selectedStudio) fetchSlots();
	}, [selectedStudio, selectedDate]);

	const fetchSlots = async () => {
		try {
			const formattedDate = format(selectedDate, "yyyy-MM-dd");
			const res = await axios.get(
				`${API_URL}/slots?studio_id=${selectedStudio.id}&date=${formattedDate}`,
			);
			setAvailableSlots(res.data.data || []);
		} catch (err) {
			toast.error("Failed to fetch available time slot.");
		}
	};

	const handleBooking = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedSlotId)
			return toast.warning("Please choose the time slot first!");
		setIsLoading(true);

		try {
			const payload = { slot_id: selectedSlotId, ...form };

			await axios.post(`${API_URL}/bookings`, payload);

			toast.success("Booking successful! Check your email notification.");
			setSelectedStudio(null);
		} catch (err: any) {
			toast.error(err.response?.data?.message || "Failed to make a booking.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleTrack = async (forcedPhone?: string, forcedId?: string) => {
		const phone = forcedPhone || trackData.phone;
		const id = forcedId || trackData.id;

		if (!phone || !id) return;

		try {
			const res = await axios.get(`${API_URL}/track?phone=${phone}&id=${id}`);
			setBookingHistory(res.data.data);

			if (forcedPhone && forcedId)
				setTrackData({ phone: forcedPhone, id: forcedId });
			toast.success("Booking data loaded!");
		} catch (err) {
			toast.error("Booking not found");
			setBookingHistory(null);
		}
	};

	useEffect(() => {
		const urlPhone = params.get("phone");
		const urlId = params.get("id");

		if (urlPhone && urlId) {
			setIsSidebarOpen(true);
			handleTrack(urlPhone, urlId);
		}
	}, [params]);

	return (
		<div
			className="min-h-screen"
			style={{ backgroundColor: colors.background }}
		>
			<Toaster position="top-center" richColors />

			{/* navbar */}
			<nav className="fixed top-0 w-full z-40 bg-white/10 px-6 py-4 flex justify-between items-center">
				<h1 className="text-2xl font-bold tracking-tighter text-white drop-shadow-md">
					LeezStudio
				</h1>
				<button
					onClick={() => setIsSidebarOpen(true)}
					className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white"
				>
					<History size={24} />
				</button>
			</nav>

			{/* sidebar for tracking booking */}
			<div
				className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white z-[60] shadow-2xl transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				<div className="p-6 h-full flex flex-col">
					<div className="flex justify-between items-center mb-8">
						<h2 className="text-xl font-bold" style={{ color: colors.primary }}>
							Track My Booking
						</h2>
						<button onClick={() => setIsSidebarOpen(false)}>
							<X />
						</button>
					</div>
					<div className="space-y-4 mb-8">
						<input
							placeholder="Booking ID"
							value={trackData.id}
							className="w-full p-3 bg-gray-100 rounded-xl border"
							onChange={(e) =>
								setTrackData({ ...trackData, id: e.target.value })
							}
						/>
						<input
							placeholder="Phone Number"
							value={trackData.phone}
							className="w-full p-3 bg-gray-100 rounded-xl border"
							onChange={(e) =>
								setTrackData({ ...trackData, phone: e.target.value })
							}
						/>
						<button
							onClick={() => handleTrack()}
							className="w-full py-3 rounded-xl text-white font-bold"
							style={{ backgroundColor: colors.primary }}
						>
							Search
						</button>
					</div>
					{bookingHistory && (
						<div className="p-5 rounded-2xl border-2 border-dashed border-accent bg-accent/5 space-y-4 text-sm">
							<div className="flex justify-between items-start">
								<h3
									className="font-bold text-lg"
									style={{ color: colors.primary }}
								>
									{bookingHistory.studio?.Name}
								</h3>
								<span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-600">
									{bookingHistory.Status}
								</span>
							</div>
							<div className="border-t pt-4 space-y-2">
								<div className="flex justify-between">
									<span>Name:</span>
									<span className="font-semibold">{bookingHistory.name}</span>
								</div>
								<div className="flex justify-between">
									<span>Date:</span>
									<span className="font-semibold">
										{bookingHistory.slot?.StartTime
											? format(new Date(bookingHistory.slot.StartTime), "PPP")
											: "-"}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Time:</span>
									<span className="font-semibold">
										{bookingHistory.slot?.StartTime
											? format(new Date(bookingHistory.slot.StartTime), "HH:mm")
											: "-"}{" "}
										WIB
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			<section className="relative h-[600px] flex items-center justify-center text-center px-4 overflow-hidden">
				<div className="absolute inset-0 bg-black/50 z-10" />
				<img
					src="/studio.jpg"
					className="absolute inset-0 w-full h-full object-cover"
					alt="Hero"
				/>
				<div className="relative z-20 text-white">
					<h1 className="text-6xl md:text-8xl font-extrabold mb-4">
						LeezStudio
					</h1>
					<p className="text-xl md:text-2xl mb-8 font-light text-accent">
						Immortalize your precious moments.
					</p>
					<button
						onClick={() =>
							document
								.getElementById("studios")
								?.scrollIntoView({ behavior: "smooth" })
						}
						className="px-10 py-4 rounded-full font-bold bg-[#A1887F]"
					>
						BOOKING
					</button>
				</div>
			</section>

			<section
				id="studios"
				className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8"
			>
				{studios.map((studio) => (
					<div
						key={studio.id}
						onClick={() => setSelectedStudio(studio)}
						className="cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
					>
						<div className="h-72 overflow-hidden">
							<img src={studio.image} className="w-full h-full object-cover" />
						</div>
						<div className="p-6">
							<h3
								className="text-2xl font-bold mb-2"
								style={{ color: colors.primary }}
							>
								{studio.name}
							</h3>
							<p className="text-[#A1887F] font-bold">
								Rp {studio.price.toLocaleString()}/session
							</p>
						</div>
					</div>
				))}
			</section>

			{/* show modal for booking */}
			{selectedStudio && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
					<div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl flex flex-col md:flex-row relative">
						<div className="md:w-1/3 p-8 bg-gray-50 border-r hidden md:block">
							<img
								src={selectedStudio.image}
								className="rounded-2xl mb-6 h-40 w-full object-cover"
							/>
							<h2
								className="text-2xl font-bold mb-4"
								style={{ color: colors.primary }}
							>
								{selectedStudio.name}
							</h2>
							<p className="text-gray-500 text-sm">
								{selectedStudio.description}
							</p>
						</div>
						<div className="md:w-2/3 p-8 overflow-y-auto">
							<button
								onClick={() => setSelectedStudio(null)}
								className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full"
							>
								<X size={20} />
							</button>
							<form onSubmit={handleBooking} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<input
										required
										placeholder="Name"
										className="p-3 bg-gray-50 rounded-xl border"
										onChange={(e) => setForm({ ...form, name: e.target.value })}
									/>
									<input
										required
										placeholder="Phone Number"
										className="p-3 bg-gray-50 rounded-xl border"
										onChange={(e) =>
											setForm({ ...form, phone: e.target.value })
										}
									/>
								</div>
								<input
									required
									type="email"
									placeholder="Email Address"
									className="w-full p-3 bg-gray-50 rounded-xl border"
									onChange={(e) => setForm({ ...form, email: e.target.value })}
								/>
								<div className="flex flex-col md:flex-row gap-8">
									<div className="flex-1">
										<label
											className="text-sm font-bold mb-2 flex items-center gap-2"
											style={{ color: colors.primary }}
										>
											<CalendarIcon size={16} /> Select Date
										</label>
										<DayPicker
											mode="single"
											selected={selectedDate}
											onSelect={(date) => date && setSelectedDate(date)}
											disabled={{ before: startOfToday() }}
										/>
									</div>
									<div className="flex-1">
										<label
											className="text-sm font-bold mb-2 flex items-center gap-2"
											style={{ color: colors.primary }}
										>
											<Clock size={16} /> Select Session
										</label>
										<div className="grid grid-cols-3 gap-2">
											{availableSlots.map((slot: any) => (
												<button
													key={slot.ID}
													type="button"
													disabled={slot.IsBooked}
													onClick={() => setSelectedSlotId(slot.ID)}
													className={`p-2 text-xs font-bold rounded-lg border ${slot.IsBooked ? "bg-gray-200 text-gray-400" : selectedSlotId === slot.ID ? "bg-[#4E342E] text-white" : ""}`}
												>
													{format(new Date(slot.StartTime), "HH:mm")}
												</button>
											))}
										</div>
									</div>
								</div>
								<button
									disabled={isLoading}
									className="w-full py-4 rounded-full text-white font-bold bg-[#4E342E] disabled:opacity-50"
								>
									{isLoading ? (
										<Loader2 className="animate-spin mx-auto" />
									) : (
										"START BOOKING"
									)}
								</button>
							</form>
						</div>
					</div>
				</div>
			)}
			<Footer />
		</div>
	);
}

export default function BookingPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-[#FAF9F8]">
					<div className="text-center">
						<Loader2
							className="animate-spin mx-auto mb-4 text-[#4E342E]"
							size={48}
						/>
						<p className="text-[#4E342E] font-medium">Loading LeezStudio...</p>
					</div>
				</div>
			}
		>
			<BookingContent />
		</Suspense>
	);
}
