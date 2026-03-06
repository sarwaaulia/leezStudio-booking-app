import {
	Instagram,
	Facebook,
	Twitter,
	Linkedin,
	ArrowRight,
} from "lucide-react";

const colors = {
	primary: "#4E342E",
	secondary: "#A1887F",
	background: "#FAF9F8",
	accent: "#D7CCC8",
};

const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer
			style={{ backgroundColor: colors.primary }}
			className="text-white pt-20 pb-10 px-6 md:px-12"
		>
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-16 mb-12 relative">
					<div className="mb-8 md:mb-0">
						<h2 className="text-5xl md:text-7xl font-bold tracking-tighter">
							LeezStudio
						</h2>
					</div>
				</div>

				<div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-[10px] uppercase tracking-[0.2em] opacity-40">
					<p>© {currentYear} LeezStudio. @leezstudio | 0812345678</p>
					<p className="mt-4 md:mt-0">Made with ❤️ by Sarwa Aulia</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
