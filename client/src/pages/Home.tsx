import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { 
  MapPin, Phone, Clock, ChevronDown, ChevronRight, Loader2, Camera,
  Scissors, Sparkles, Smile, Target, Award, ShieldCheck, Zap
} from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import { TestimonialsSection } from '@/components/ui/testimonial-v2';
import { trpc } from '@/lib/trpc';

const BARBER_PHOTOS: Record<string, string> = {
  'Wilfredo': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=500',
  'Jairo': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=500',
  'Jesús': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500',
  'Daniel': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=500',
};

const DEFAULT_BARBER_PHOTO = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=400&h=500';

function getBarberPhoto(name: string) {
  const first = name.split(' ')[0];
  return BARBER_PHOTOS[first] || DEFAULT_BARBER_PHOTO;
}

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

function formatCOP(price: string) {
  const value = Math.round(parseFloat(price));
  return `$${value.toLocaleString('es-CO')} COP`;
}

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
  extras: 'Cuidados Extras',
};

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingBarberId, setBookingBarberId] = useState<number | undefined>(undefined);
  const [bookingServiceId, setBookingServiceId] = useState<number | undefined>(undefined);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<Exclude<ServiceCategory, 'combos'>>('cortes');
  const revealRef = useRef<HTMLDivElement>(null);

  const openBooking = (serviceId?: number, barberId?: number) => {
    setBookingServiceId(serviceId);
    setBookingBarberId(barberId);
    setIsBookingOpen(true);
  };

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const faqs = [
    {
      id: 1,
      question: '¿Cómo puedo reservar una cita?',
      answer: 'Usa nuestro sistema de reservas online: selecciona el servicio, el barbero, la fecha y hora, ingresa tus datos y confirma. Recibirás la confirmación directa en pantalla.'
    },
    {
      id: 2,
      question: '¿Cuánto tiempo dura un corte?',
      answer: 'Un corte clásico o degradado de nivel dura aproximadamente 30-40 minutos. Si sumas barba o mascarilla premium, reservamos entre 45-60 minutos para consentirte como te lo mereces.'
    },
    {
      id: 3,
      question: '¿Puedo elegir un barbero específico?',
      answer: '¡Por supuesto! En nuestro sistema de reservas puedes seleccionar al barbero de tu preferencia: Wilfredo, Jairo, Jesús o Daniel, según su disponibilidad.'
    },
    {
      id: 5,
      question: '¿Ofrecen combos especiales?',
      answer: 'Sí, tenemos combos insignia que combinan corte, barba, cejas y mascarilla facial con precios especiales para que salgas completamente renovado.'
    }
  ];

  const differentials = [
    {
      icon: ShieldCheck,
      title: 'Tijeras de Autor',
      description: 'Wilfredo, Jairo, Jesús y Daniel aplican técnicas avanzadas y pulso impecable.'
    },
    {
      icon: Scissors,
      title: 'Estilo Barranquillero',
      description: 'Combinamos la elegancia clásica europea con el flow y frescura del Caribe.'
    },
    {
      icon: Zap,
      title: 'Puntualidad Absoluta',
      description: 'Respetamos tu tiempo. Sin filas eternas, agendado directo a tu hora.'
    },
    {
      icon: Target,
      title: 'Experiencia Premium',
      description: 'Un espacio diseñado para caballeros, música selecta y un trato de primera.'
    },
    {
      icon: Award,
      title: 'Productos de Élite',
      description: 'Solo usamos ceras, bálsamos y lociones de marcas profesionales certificadas.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" ref={revealRef}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full border-b border-border z-50 transition-all duration-300 ${navScrolled ? 'navbar-scrolled' : 'bg-background/80 backdrop-blur-md'}`}>
        <div className="container flex items-center justify-between h-16">
          <a href="#" className="text-2xl font-bold text-primary tracking-tight" translate="no">BARBA AZUL</a>
          <div className="hidden md:flex gap-8">
            <a href="#servicios" className="hover:text-primary transition-colors duration-200">Servicios</a>
            <a href="#galeria" className="hover:text-primary transition-colors duration-200">Galería</a>
            <a href="#barberos" className="hover:text-primary transition-colors duration-200">Barberos</a>
            <a href="#contacto" className="hover:text-primary transition-colors duration-200">Contacto</a>
          </div>
          <button onClick={() => openBooking()} className="btn-primary text-sm">
            Reservar Cita
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        <div 
          className="absolute inset-0 bg-[url('/images/imagen_hero.png')] bg-cover bg-center bg-no-repeat"
          aria-hidden="true"
        />
        <div 
          className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background md:bg-gradient-to-r md:from-background/95 md:via-background/85 md:to-background/20 z-0" 
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/25 z-0" aria-hidden="true" />
        
        <div className="relative z-10 container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Barba Azul: <span className="brand-emphasis">Estilo & Tradición</span> en Barranquilla
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg animate-fade-in-delay leading-relaxed">
              La barbería que define el estándar de excelencia en la Arenosa. Cortes milimétricos, afeitados rituales y atención premium de la mano de verdaderos artistas de la tijera.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-delay">
              <button onClick={() => openBooking()} className="btn-primary text-lg">
                Agendar mi Cita
              </button>
              <a href="#servicios" className="btn-secondary text-lg inline-flex items-center justify-center">
                Ver Carta de Servicios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="section-padding bg-card/30 relative">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Carta de Servicios</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Cortes perfectos, cuidado facial y combos premium con la dedicación de nuestros maestros barberos.
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

          {/* Featured Combos */}
          {!servicesQuery.isLoading && !servicesQuery.isError && combos.length > 0 && (
            <div className="mb-14 reveal-stagger">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {combos.map((service, index) => (
                  <Card key={service.id} className="card-premium group relative overflow-hidden flex flex-col">
                    <div className="relative h-48 w-full -mx-6 -mt-6 mb-4 overflow-hidden bg-muted">
                      <img
                        src={`/images/combo-${(index % 3) + 1}.png`}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="inline-block text-[11px] uppercase tracking-widest font-semibold text-accent border border-accent/40 rounded-full px-2.5 py-1 mb-4 w-fit">
                        Combo Recomendado
                      </span>
                      <div className="mb-3">{getServiceIcon(service.name)}</div>
                      <h3 className="text-lg font-bold mb-1">{service.name}</h3>
                      <p className="price-serif text-accent text-xl font-semibold mb-1">{formatCOP(service.price)}</p>
                      <p className="text-muted-foreground text-xs mb-3">{service.durationMinutes} min aprox.</p>
                      <p className="text-muted-foreground text-sm mb-6 flex-1">{service.description}</p>
                      <button onClick={() => openBooking(service.id)} className="w-full btn-primary text-center text-sm">
                        Reservar Combo
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Category Tabs */}
          {!servicesQuery.isLoading && !servicesQuery.isError && individualByCategory.length > 0 && (
            <div className="space-y-8 max-w-3xl mx-auto reveal">
              <div className="flex flex-wrap gap-2 justify-center border-b border-border/60 pb-6">
                {individualByCategory.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => setActiveTab(group.key)}
                    className={`tab-btn ${activeTab === group.key ? 'active' : ''}`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border bg-card/50 shadow-lg">
                {individualByCategory
                  .filter((group) => group.key === activeTab)
                  .map((group) => (
                    <div key={group.key} className="divide-y divide-border/60">
                      {group.items.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => openBooking(service.id)}
                          className="service-row w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-all duration-300 hover:pl-8"
                          aria-label={`Reservar ${service.name} - ${formatCOP(service.price)}`}
                        >
                          <span className="flex items-center gap-4 min-w-0">
                            <span className="shrink-0 p-2 bg-muted/50 rounded-lg">{getServiceIcon(service.name)}</span>
                            <span className="min-w-0">
                              <span className="block font-bold text-foreground text-base">{service.name}</span>
                              <span className="block text-xs text-muted-foreground mt-0.5">{service.durationMinutes} min aprox.</span>
                            </span>
                          </span>
                          <span className="flex items-center gap-4 shrink-0">
                            <span className="price-serif text-accent font-semibold text-lg">{formatCOP(service.price)}</span>
                            <ChevronRight className="service-row-arrow w-5 h-5 text-primary" aria-hidden="true" />
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeria" className="section-padding">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Galería de Trabajos</h2>
            <p className="text-muted-foreground text-lg">Próximamente fotos de cortes reales y estilo local</p>
          </div>

          <Card className="card-premium max-w-xl mx-auto text-center py-12 border-dashed">
            <Camera className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Estamos armando nuestro portafolio digital en Barranquilla.</p>
            <p className="text-muted-foreground text-sm">Muy pronto verás aquí los mejores degradados y acabados de la Arenosa.</p>
          </Card>
        </div>
      </section>

      {/* Barbers Section */}
      <section id="barberos" className="section-padding bg-card/30 relative">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nuestros Maestros</h2>
            <p className="text-muted-foreground text-lg">Profesionales barranquilleros con pasión por la excelencia</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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

            {!barbersQuery.isLoading && !barbersQuery.isError && barbers.map((barber) => {
              const photoUrl = getBarberPhoto(barber.name);
              return (
                <Card key={barber.id} className="card-premium text-center overflow-hidden p-0 flex flex-col justify-between">
                  <div className="relative h-72 w-full overflow-hidden bg-accent/5 group">
                    <img 
                      src={photoUrl} 
                      alt={`Foto de ${barber.name}`} 
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                  </div>
                  <div className="p-6 pt-4">
                    <h3 className="text-2xl font-bold mb-1">{barber.name}</h3>
                    <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-4">Especialista / Master Barber</p>
                    <button onClick={() => openBooking(undefined, barber.id)} className="w-full btn-primary text-center text-sm">
                      Reservar con {barber.name.split(' ')[0]}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* Differentials Section */}
      <section className="section-padding bg-card/30 relative">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Por Qué Barba Azul?</h2>
            <p className="text-muted-foreground text-lg">El estilo barranquillero con el estándar premium más alto</p>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-card/40 divide-y divide-border md:divide-y-0 md:divide-x md:flex reveal-stagger shadow-lg">
            {differentials.map((diff, idx) => {
              const Icon = diff.icon;
              return (
                <div key={idx} className="flex-1 p-6 text-center group hover:bg-muted/30 transition-all duration-300">
                  <div className="flex justify-center mb-4">
                    <Icon className="w-10 h-10 text-accent transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold mb-2">{diff.title}</h3>
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
            <p className="text-muted-foreground text-lg">Resolvemos tus inquietudes para que tu experiencia sea perfecta</p>
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
                  <p className="text-muted-foreground mt-4 animate-fade-in leading-relaxed text-sm">{faq.answer}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="section-padding bg-card/30 relative">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Contacto & Sede</h2>
            <p className="text-muted-foreground text-lg">Pásate hoy mismo o escríbenos para más información</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 reveal-stagger">
            <Card className="card-premium text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ubicación</h3>
              <p className="text-muted-foreground text-sm">Calle 71 #33-47, Barranquilla, Atlántico</p>
            </Card>
            <Card className="card-premium text-center flex flex-col justify-between p-6">
              <div>
                <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Teléfono</h3>
              </div>
              <a 
                href="tel:+573007002929"
                className="text-primary hover:text-secondary font-semibold text-lg transition-colors duration-200"
              >
                +57 300 700 2929
              </a>
            </Card>
            <Card className="card-premium text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Horario Costeño</h3>
              <p className="text-muted-foreground text-sm">Todos los días: 9:00 am - 9:00 pm</p>
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
          <p>&copy; {new Date().getFullYear()} Barbería Barba Azul. Tradición & Estilo. Barranquilla, Colombia.</p>
        </div>
      </footer>

      {/* Booking Modal — full Supabase flow */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialBarberId={bookingBarberId}
        initialServiceId={bookingServiceId}
      />
    </div>
  );
}