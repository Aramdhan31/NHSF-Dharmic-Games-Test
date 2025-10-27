import React from 'react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon, Trophy, Twitter, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

// Removed footer navigation links for cleaner design

export function Footer() {
  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/nhsf_uk/',
      icon: InstagramIcon,
      bgColor: 'bg-gradient-to-r from-[#E4405F] via-[#F56040] to-[#FFDC80]',
      hoverColor: 'hover:opacity-90'
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/NHSFUK/',
      icon: FacebookIcon,
      bgColor: 'bg-[#1877F2]',
      hoverColor: 'hover:bg-[#166FE5]'
    },
    {
      name: 'TikTok',
      href: 'https://www.tiktok.com/@nhsf_uk',
      icon: TikTokIcon,
      bgColor: 'bg-black',
      hoverColor: 'hover:bg-gray-800'
    },
    {
      name: 'YouTube',
      href: 'https://www.youtube.com/@NHSFUK',
      icon: YoutubeIcon,
      bgColor: 'bg-[#FF0000]',
      hoverColor: 'hover:bg-[#E60000]'
    },
    {
      name: 'Linktree',
      href: 'https://linktr.ee/nhsf',
      icon: LinkIcon, // Link icon for Linktree
      bgColor: 'bg-[#00A670]',
      hoverColor: 'hover:bg-[#008B5A]'
    }
  ];

  return (
		<footer className="w-full bg-gradient-to-br from-orange-50 to-red-50 border-t border-orange-200">
			<div className="max-w-4xl mx-auto px-6 py-8 text-center">
				{/* Brand Section */}
				<div className="mb-6">
					<div className="flex items-center justify-center space-x-3 mb-3">
						<div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
							<Trophy className="w-5 h-5 text-white" />
						</div>
						<h3 className="text-xl font-bold text-gray-900">NHSF (UK) Dharmic Games</h3>
					</div>
					<p className="text-gray-600 text-sm mb-2">
						The National Hindu Student Forum's Zonal & National Competition
					</p>
					<p className="text-gray-500 text-xs">
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
				</div>

				{/* Social Media Section */}
				<div className="pt-4 border-t border-orange-200">
					<h4 className="text-sm font-semibold text-gray-900 mb-3">
						Follow us
					</h4>
					
					<div className="flex justify-center space-x-3 mb-3">
						{socialLinks.map((social) => (
							<Link
								key={social.name}
								href={social.href}
								className={`w-9 h-9 rounded-lg ${social.bgColor} ${social.hoverColor} flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:shadow-md`}
								aria-label={social.name}
							>
								<social.icon className="w-4 h-4 text-white" />
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}

