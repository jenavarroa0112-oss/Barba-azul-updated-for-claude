import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Star, MapPin, Phone, Clock, ChevronDown, ChevronRight, Loader2, Camera,
  Scissors, Sparkles, Smile, Target, Award, ShieldCheck, Zap, User
} from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import { TestimonialsSection } from '@/components/ui/testimonial-v2';
import { trpc } from '@/lib/trpc';

// Small decorative icon per service — purely visual, not stored in the DB.
function getServiceIcon(name: string) {
  const n = name.toLowerCase();
  const className = "w-8 h-8 text-accent transition-transform duration-300 group-hover:scale-110";
  if (n.includes('combo')) return <Target className={className} aria-hidden="true" />;
  if (n.includes('fade') || n.includes('degradado')) return <Sparkles className={className} aria-hidden="true" />;
  if (n.includes('afeitado')) return <Scissors className={className} aria-hidden="true" />;
  if (n.includes('mascarilla') || n.includes('facial')) return <Award className={className} aria-hidden="true" />;
  if (n.includes('ceja')) return <Sparkles className={className} aria-hidden="true" />;
  if (n.includes('niño')) return <Smile className={className} aria-hidden="true" />;
  if (n.includes('barba')) return <Scissors className={className} aria-hidden="true" />;
  return <Scissors className={className} aria-hidden="true" />;
}

// DB stores price as a numeric string (e.g. "25000.00") in COP.
function formatCOP(price: string) {
  const value = Math.round(parseFloat(price));
  return `$${value.toLocaleString('es-CO')} COP`;
}

// Groups the flat services list into a real menu structure — combos get
// their own featured cards, everything else is grouped under a category
// so 12 services don't render as one undifferentiated wall of cards.
type ServiceCategory = 'combos' | 'cortes' | 'barba' | 'extras';

function getServiceCategory(name: string): ServiceCategory {
  const n = name.toLowerCase();
  if (n.includes('combo')) return 'combos';
  if (n.includes('corte') || n.includes('fade') || n.includes('degradado')) return 'cortes';
  if (n.includes('barba') || n.includes('afeitado')) return 'barba';
  return 'extras';
}

const CATEGORY_LABELS: Record<Exclude<ServiceCategory, 'combos'>, string> = {
  cortes: 'Cortes & Estilo',
  barba: 'Barba & Afeitado',
  extras: 'Cuidado & Extras',
};

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingBarberId, setBookingBarberId] = useState<number | undefined>(undefined);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  const openBooking = (barberId?: number) => {
    setBookingBarberId(barberId);
    setIsBookingOpen(true);
  };

  // Navbar becomes opaque + blurred when the user scrolls past the hero.
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-reveal: watch every .reveal element and add .is-visible when it
  // enters the viewport. A 15% threshold gives a nice "just appeared" feel
  // without revealing too early on tall sections.
  useEffect(() => {
    const root = revealRef.current ?? document;
    const targets = root.querySelectorAll('.reveal, .reveal-stagger');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Services and barbers now come straight from the database — the same
  // data the booking modal uses — instead of a hardcoded mock list.
  const servicesQuery = trpc.services.list.useQuery();
  const barbersQuery = trpc.barbers.list.useQuery();
  const services = servicesQuery.data || [];
  const barbers = barbersQuery.data || [];

  const combos = services.filter((s) => getServiceCategory(s.name) === 'combos');
  const individualByCategory = (['cortes', 'barba', 'extras'] as const)
    .map((cat) => ({
      key: cat,
      label: CATEGORY_LABELS[cat],
      items: services.filter((s) => getServiceCategory(s.name) === cat),
    }))
    .filter((group) => group.items.length > 0);

  // FAQ data
  const faqs = [
    {
      id: 1,
      question: '¿Cómo puedo reservar una cita?',
      answer: 'Puedes reservar directamente desde nuestro sitio web usando el sistema de reservas online, o llamarnos al +57 300 700 2929.'
    },
    {
      id: 2,
      question: '¿Cuánto tiempo dura un corte?',
      answer: 'Un corte clásico dura aproximadamente 30-40 minutos. Los servicios premium pueden tomar entre 45-60 minutos.'
    },
    {
      id: 3,
      question: '¿Puedo elegir barbero específico?',
      answer: 'Sí, durante el proceso de reserva puedes seleccionar el barbero de tu preferencia según su disponibilidad.'
    },
    {
      id: 5,
      question: '¿Ofrecen servicios para grupos?',
      answer: 'Sí, ofrecemos paquetes especiales para grupos. Contáctanos para más información.'
    }
  ];

  // Differentials
  const differentials = [
    {
      icon: ShieldCheck,
      title: 'Barberos Expertos',
      description: 'Profesionales certificados con años de experiencia en barbería premium.'
    },
    {
      icon: Scissors,
      title: 'Calidad del Corte',
      description: 'Técnicas precisas y acabados impecables en cada servicio.'
    },
    {
      icon: Zap,
      title: 'Rapidez',
      description: 'Servicios eficientes sin comprometer la calidad del resultado.'
    },
    {
      icon: Target,
      title: 'Experiencia Inigualable',
      description: 'Ambiente premium con atención personalizada y profesional.'
    },
    {
      icon: Award,
      title: 'Atención Profesional',
      description: 'Servicio de clase mundial con detalles que marcan la diferencia.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" ref={revealRef}>
      {/* Navigation — becomes opaque + blurred after scrolling past the hero */}
      <nav className={`fixed top-0 w-full border-b border-border z-50 transition-all duration-300 ${navScrolled ? 'navbar-scrolled' : 'bg-background/80 backdrop-blur-md'}`}>
        <div className="container flex items-center justify-between h-16">
          <a href="#" className="text-2xl font-bold text-primary tracking-tight" translate="no">BARBA AZUL</a>
          <div className="hidden md:flex gap-8">
            <a href="#servicios" className="hover:text-primary transition-colors duration-200">Servicios</a>
            <a href="#galeria" className="hover:text-primary transition-colors duration-200">Galería</a>
            <a href="#barberos" className="hover:text-primary transition-colors duration-200">Barberos</a>
            <a href="#contacto" className="hover:text-primary transition-colors duration-200">Contacto</a>
          </div>
          <button onClick={() => openBooking()} className="btn-primary">
            Reservar Cita
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* No real photo of the shop yet — a gradient instead of a broken/missing
            image. Swap this div for a real background photo once you have one. */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/15">
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Experiencia <span className="brand-emphasis">Premium</span> en Barbería
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg animate-fade-in-delay">
              Calidad internacional, cercanía local. Descubre la barbería que define el estándar de excelencia en Barranquilla.
            </p>
            <div className="flex gap-4 animate-fade-in-delay">
              <button onClick={() => openBooking()} className="btn-primary text-lg">
                Reservar mi Cita
              </button>
              <a href="#servicios" className="btn-secondary text-lg inline-flex items-center justify-center">
                Conocer Más
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section — combos as featured cards, everything else as a
          categorized menu list. A wall of 12 identical cards was the #1
          complaint; a real barbershop price board doesn't look like that. */}
      <section id="servicios" className="section-padding bg-card/50">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nuestros Servicios</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Cada servicio está diseñado para ofrecerte la mejor experiencia de barbería premium.
            </p>
          </div>

          {servicesQuery.isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground" aria-live="polite">
              <Loader2 className="w-6 h-6 animate-spin mr-2" aria-hidden="true" /> Cargando servicios…
            </div>
          )}
          {servicesQuery.isError && (
            <p className="text-center text-muted-foreground py-12" role="alert">
              No pudimos cargar los servicios. Intenta de nuevo más tarde.
            </p>
          )}
          {!servicesQuery.isLoading && !servicesQuery.isError && services.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Pronto publicaremos el catálogo de servicios aquí.
            </p>
          )}

          {/* Combos — the upsell, small in number, deserve visual weight */}
          {combos.length > 0 && (
            <div className="mb-14 reveal-stagger">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {combos.map((service) => (
                  <Card key={service.id} className="card-premium group relative overflow-hidden">
                    <span className="inline-block text-[11px] uppercase tracking-widest font-semibold text-accent border border-accent/40 rounded-full px-2.5 py-1 mb-4">
                      Combo
                    </span>
                    <div className="mb-3">{getServiceIcon(service.name)}</div>
                    <h3 className="text-lg font-bold mb-1">{service.name}</h3>
                    <p className="price-serif text-accent text-xl font-semibold mb-1">{formatCOP(service.price)}</p>
                    <p className="text-muted-foreground text-xs mb-3">{service.durationMinutes} min aprox.</p>
                    <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                    <button onClick={() => openBooking()} className="w-full btn-primary text-sm">
                      Reservar
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Individual services — barbershop price-board style, grouped by category */}
          <div className="space-y-10 max-w-3xl mx-auto reveal-stagger">
            {individualByCategory.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs uppercase tracking-widest text-primary font-semibold whitespace-nowrap">
                    {group.label}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-card/40">
                  {group.items.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => openBooking()}
                      className="service-row w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-label={`Reservar ${service.name} - ${formatCOP(service.price)}`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0">{getServiceIcon(service.name)}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold truncate">{service.name}</span>
                          <span className="block text-xs text-muted-foreground">{service.durationMinutes} min aprox.</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="price-serif text-accent font-semibold">{formatCOP(service.price)}</span>
                        <ChevronRight className="service-row-arrow w-4 h-4 text-primary" aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {services.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-8">*Precios estimados, sujetos a confirmación.</p>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeria" className="section-padding">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Galería de Trabajos</h2>
            <p className="text-muted-foreground text-lg">Muy pronto</p>
          </div>

          <Card className="card-premium max-w-xl mx-auto text-center py-12">
            <Camera className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Estamos armando esta galería con fotos reales de nuestro trabajo.</p>
            <p className="text-muted-foreground text-sm">Vuelve pronto, o agenda tu cita y sé parte de ella.</p>
          </Card>
        </div>
      </section>

      {/* Barbers Section */}
      <section id="barberos" className="section-padding bg-card/50">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nuestros Barberos</h2>
            <p className="text-muted-foreground text-lg">Profesionales expertos dedicados a tu estilo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {barbersQuery.isLoading && (
              <div className="col-span-full flex justify-center py-12 text-muted-foreground" aria-live="polite">
                <Loader2 className="w-6 h-6 animate-spin mr-2" aria-hidden="true" /> Cargando barberos…
              </div>
            )}
            {barbersQuery.isError && (
              <p className="col-span-full text-center text-muted-foreground" role="alert">
                No pudimos cargar el equipo. Intenta de nuevo más tarde.
              </p>
            )}
            {!barbersQuery.isLoading && !barbersQuery.isError && barbers.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                Pronto presentaremos a nuestro equipo aquí.
              </p>
            )}
            {barbers.map((barber) => {
              return (
                <Card key={barber.id} className="card-premium text-center overflow-hidden">
                  {/* No photo on file yet for this barber — initials avatar instead
                      of a broken/placeholder image. Swap in a real photo URL once
                      you have one (would need an `imageUrl` column in `barbers`). */}
                  <div className="w-full h-64 mb-4 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-6xl font-bold text-accent">{barber.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{barber.name}</h3>
                  <button onClick={() => openBooking(barber.id)} className="w-full btn-primary">
                    Reservar con {barber.name.split(' ')[0]}
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* Differentials Section */}
      <section className="section-padding bg-card/50">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Por Qué Barba Azul?</h2>
            <p className="text-muted-foreground text-lg">Razones para elegirnos</p>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-card/40 divide-y divide-border md:divide-y-0 md:divide-x md:flex reveal-stagger">
            {differentials.map((diff, idx) => {
              const Icon = diff.icon;
              return (
                <div key={idx} className="flex-1 p-6 text-center group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex justify-center mb-3">
                    <Icon className="w-8 h-8 text-accent transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold mb-2">{diff.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{diff.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container max-w-3xl">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground text-lg">Resolvemos tus dudas</p>
          </div>

          <div className="space-y-4 reveal">
            {faqs.map((faq) => (
              <Card 
                key={faq.id}
                role="button"
                tabIndex={0}
                aria-expanded={expandedFaq === faq.id}
                className="card-premium cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedFaq(expandedFaq === faq.id ? null : faq.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-primary transition-transform duration-300 ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </div>
                {expandedFaq === faq.id && (
                  <p className="text-muted-foreground mt-4 animate-fade-in">{faq.answer}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="section-padding bg-card/50">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Contacto</h2>
            <p className="text-muted-foreground text-lg">Visítanos o ponte en contacto</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 reveal-stagger">
            <Card className="card-premium text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="text-xl font-bold mb-2">Ubicación</h3>
              <p className="text-muted-foreground">Calle 71 #33-47, Barranquilla, Atlántico</p>
            </Card>
            <Card className="card-premium text-center">
              <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Teléfono</h3>
              <a href="tel:+573007002929" className="text-primary hover:text-secondary transition-colors duration-200">
                +57 300 700 2929
              </a>
            </Card>
            <Card className="card-premium text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Horarios</h3>
              <p className="text-muted-foreground">Todos los días: 9:00 am - 9:00 pm</p>
            </Card>
          </div>

          <div className="relative border border-primary/20 rounded-xl overflow-hidden h-96 reveal map-frame">
            <iframe
              src="https://www.google.com/maps?q=10.9821957,-74.8109534&z=16&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Ubicación de Barba Azul en el mapa"
            ></iframe>
            <a
              href="https://www.google.com/maps?q=10.9821957,-74.8109534&z=16"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-card/95 border border-border text-primary text-sm font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
            >
              Abrir en Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Barbería Barba Azul. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialBarberId={bookingBarberId}
      />
    </div>
  );
}
