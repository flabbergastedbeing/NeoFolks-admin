import { EASE_OUT, stagger } from "@/lib/motion";
import { motion } from "framer-motion";
import { Mail, Linkedin, Instagram, Github, MapPin } from "lucide-react";
import { contactChannels } from "@/data/contact";

const iconMap = {
  mail: Mail,
  linkedin: Linkedin,
  instagram: Instagram,
  github: Github,
  mapPin: MapPin,
};

export function ContactChannels() {
  return (
    <div className="flex flex-col gap-16">
      {contactChannels.map((channel, i) => {
        const Icon = iconMap[channel.icon];
        const content = (
          <div className="flex items-center gap-16 rounded-card border border-graphite bg-carbon-card p-20 transition-colors hover:border-steel-gray">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-input border border-graphite text-ghost-white">
              <Icon className="h-18 w-18" />
            </span>
            <div>
              <p className="text-body-sm text-ash-gray">{channel.label}</p>
              <p className="text-body font-medium text-ghost-white">{channel.value}</p>
            </div>
          </div>
        );

        return (
          <motion.div
            key={channel.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: stagger(i, 0.05), ease: EASE_OUT }}
          >
            {channel.href ? (
              <a href={channel.href} className="block">
                {content}
              </a>
            ) : (
              content
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
