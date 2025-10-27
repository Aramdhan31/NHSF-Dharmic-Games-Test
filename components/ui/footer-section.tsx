'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon, Trophy } from 'lucide-react';
import Link from 'next/link';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Competition',
		links: [
			{ title: 'Teams', href: '/teams' },
			{ title: 'Game', href: '/game' },
			{ title: 'Results', href: '/results' },
			{ title: 'Leaderboard', href: '/' },
		],
	},
	{
		label: 'NHSF (UK)',
		links: [
			{ title: 'About NHSF (UK)', href: 'https://www.nhsf.org.uk/' },
			{ title: 'Rules', href: '/rules' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Terms of Service', href: '/terms' },
		],
	},
	{
		label: 'Support',
		links: [
			{ title: 'Help Center', href: '/help' },
			{ title: 'Contact', href: '/contact' },
			{ title: 'FAQ', href: '/faq' },
			{ title: 'Admin', href: '/admin' },
		],
	},
	{
		label: 'Social Links',
		links: [
			{ title: 'Facebook', href: '#', icon: FacebookIcon },
			{ title: 'Instagram', href: '#', icon: InstagramIcon },
			{ title: 'Youtube', href: '#', icon: YoutubeIcon },
			{ title: 'LinkedIn', href: '#', icon: LinkedinIcon },
		],
	},
];

export function Footer() {
	return (
		<footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 px-6 py-12 lg:py-16">
			<div className="bg-orange-300/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
				<AnimatedContainer className="space-y-4">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
							<Trophy className="w-4 h-4 text-white" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-gray-900">NHSF (UK) NATCOM</h3>
							<p className="text-xs text-orange-600">Matrix Competition</p>
						</div>
					</div>
					<p className="text-muted-foreground mt-8 text-sm md:mt-0">
						The National Hindu Student Forum's Zonal & National Competition, bringing together students from across the UK in exciting challenges.
					</p>
					<p className="text-muted-foreground text-sm">
						© {new Date().getFullYear()} National Hindu Student Forum(UK). All rights reserved.
					</p>
					<div className="mt-2">
						<a 
							href="/privacy-policy" 
							className="text-xs text-orange-600 hover:text-orange-700 underline"
						>
							Privacy Policy
						</a>
					</div>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs font-semibold text-gray-900 mb-4">{section.label}</h3>
								<ul className="text-muted-foreground space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<Link
												href={link.href}
												className="hover:text-orange-600 inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-1 size-4" />}
												{link.title}
											</Link>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
