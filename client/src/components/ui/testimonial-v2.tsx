import React from 'react';
import { motion } from "framer-motion";

// --- Types ---
interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

// --- Data ---
const testimonials: Testimonial[] = [
  {
    text: "Excelente servicio, muy profesionales. El ambiente es increíble.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Michael C.",
    role: "Cliente",
  },
  {
    text: "La mejor barbería de la ciudad, siempre salgo satisfecho.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Jonathan Y.",
    role: "Cliente",
  },
  {
    text: "Atención impecable y cortes de calidad. 100% recomendados.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Saman Malik",
    role: "Cliente",
  },
  {
    text: "Me encanta el estilo y la dedicación con la que trabajan.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Omar Raza",
    role: "Cliente",
  },
  {
    text: "Ambiente muy relajado y los barberos saben exactamente lo que hacen.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Zainab Hussain",
    role: "Cliente",
  },
  {
    text: "Resultados increíbles, un degradado perfecto siempre.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Aliza Khan",
    role: "Cliente",
  },
];

const firstColumn = testimonials.slice(0, 2);
const secondColumn = testimonials.slice(2, 4);
const thirdColumn = testimonials.slice(4, 6);

// --- Sub-Components ---
const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <li 
                  key={`${index}-${i}`}
                  className="p-6 rounded-2xl border border-border shadow-sm max-w-xs w-full bg-card transition-all duration-300 cursor-default select-none" 
                >
                  <blockquote className="m-0 p-0">
                    <p className="text-muted-foreground leading-relaxed font-normal m-0">
                      "{text}"
                    </p>
                    <footer className="flex items-center gap-3 mt-4">
                      <img
                        width={40}
                        height={40}
                        src={image}
                        alt={`Avatar of ${name}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <cite className="font-semibold not-italic text-foreground">
                          {name}
                        </cite>
                        <span className="text-xs text-muted-foreground">
                          {role}
                        </span>
                      </div>
                    </footer>
                  </blockquote>
                </li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

export const TestimonialsSection = () => {
  return (
    <section 
      aria-labelledby="testimonials-heading"
      className="section-padding relative overflow-hidden"
    >
      <div className="container px-4 z-10 mx-auto">
        <div className="text-center mb-16">
          <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-bold mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descubre por qué Barba Azul es la preferida en Barranquilla.
          </p>
        </div>

        <div 
          className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[600px] overflow-hidden"
          role="region"
          aria-label="Scrolling Testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={20} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={25} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={22} />
        </div>
      </div>
    </section>
  );
};
