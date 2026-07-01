import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, MapPin, Phone, Clock, ChevronDown, Loader2, Camera } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import { trpc } from '@/lib/trpc';

// Small decorative icon per service — purely visual, not stored in the DB.
function getServiceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('combo')) return '🎯';
  if (n.includes('fade') || n.includes('degradado')) return '✨';
  if (n.includes('afeitado')) return '🪒';
  if (n.includes('mascarilla') || n.includes('facial')) return '💆';
  if (n.includes('ceja')) return '👁️';
  if (n.includes('niño')) return '🧒';
  if (n.includes('barba')) return '🧔';
  return '✂️';
}

// DB stores price as a numeric string (e.g. "25000.00") in COP.
function formatCOP(price: string) {
  const value = Math.round(parseFloat(price));
  return `$${value.toLocaleString('es-CO')} COP`;
}

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

  // Testimonios reales, tomados de las reseñas de Google de Barba Azul
  // (las mismas 2 que ya usamos en el sitio estático).
  const testimonials = [
    {
      id: 1,
      name: 'Michael C.',
      rating: 5,
      quote: 'Una actitud excelente y un fade impecable',
      comment: 'El equipo se nota cómodo con cualquier estilo, especialmente con degradados y cortes modernos. Totalmente recomendados para un buen corte de cabello.',
      source: 'Reseña de Google · hace 5 meses',
    },
    {
      id: 2,
      name: 'Jonathan Y.',
      rating: 5,
      quote: 'La mejor barbería de Barranquilla',
      comment: 'Muy contento con el servicio. El ambiente es súper tranquilo y todo el equipo sabe demasiado de su oficio.',
      source: 'Reseña de Google · hace 4 meses',
    },
  ];

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
      icon: '👨‍💼',
      title: 'Barberos Expertos',
      description: 'Profesionales certificados con años de experiencia en barbería premium.'
    },
    {
      icon: '✂️',
      title: 'Calidad del Corte',
      description: 'Técnicas precisas y acabados impecables en cada servicio.'
    },
    {
      icon: '⚡',
      title: 'Rapidez',
      description: 'Servicios eficientes sin comprometer la calidad del resultado.'
    },
    {
      icon: '🎯',
      title: 'Experiencia Inigualable',
      description: 'Ambiente premium con atención personalizada y profesional.'
    },
    {
      icon: '👔',
      title: 'Atención Profesional',
      description: 'Servicio de clase mundial con detalles que marcan la diferencia.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" ref={revealRef}>
      {/* Navigation — becomes opaque + blurred after scrolling past the hero */}
      <nav className={`fixed top-0 w-full border-b border-border z-50 transition-all duration-300 ${navScrolled ? 'navbar-scrolled' : 'bg-background/80 backdrop-blur-md'}`}>
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-accent">BARBA AZUL</h1>
          <div className="hidden md:flex gap-8">
            <a href="#servicios" className="hover:text-accent transition-colors duration-200">Servicios</a>
            <a href="#galeria" className="hover:text-accent transition-colors duration-200">Galería</a>
            <a href="#barberos" className="hover:text-accent transition-colors duration-200">Barberos</a>
            <a href="#contacto" className="hover:text-accent transition-colors duration-200">Contacto</a>
          </div>
          <Button 
            onClick={() => openBooking()}
            className="btn-primary"
          >
            Reservar Cita
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* No real photo of the shop yet — a gradient instead of a broken/missing
            image. Swap this div for a real background photo once you have one. */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/10">
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Experiencia <span className="shimmer-text">Premium</span> en Barbería
            </h2>
            <p className="text-xl text-muted-foreground max-w-lg animate-fade-in-delay">
              Calidad internacional, cercanía local. Descubre la barbería que define el estándar de excelencia en Barranquilla.
            </p>
            <div className="flex gap-4 animate-fade-in-delay">
              <Button 
                onClick={() => openBooking()}
                className="btn-primary text-lg"
              >
                Reservar mi Cita
              </Button>
              <Button className="btn-secondary text-lg">
                Conocer Más
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="section-padding bg-card/50">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nuestros Servicios</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Cada servicio está diseñado para ofrecerte la mejor experiencia de barbería premium.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 reveal-stagger">
            {servicesQuery.isLoading && (
              <div className="col-span-full flex justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando servicios...
              </div>
            )}
            {servicesQuery.isError && (
              <p className="col-span-full text-center text-muted-foreground">
                No pudimos cargar los servicios. Intenta de nuevo más tarde.
              </p>
            )}
            {!servicesQuery.isLoading && !servicesQuery.isError && services.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                Pronto publicaremos el catálogo de servicios aquí.
              </p>
            )}
            {services.map((service) => (
              <Card key={service.id} className="card-premium group cursor-pointer">
                <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">{getServiceIcon(service.name)}</div>
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <p className="text-accent text-lg font-semibold mb-1">{formatCOP(service.price)}*</p>
                <p className="text-muted-foreground text-xs mb-3">{service.durationMinutes} min aprox.</p>
                <p className="text-muted-foreground text-sm">{service.description}</p>
                <Button 
                  onClick={() => openBooking()}
                  className="w-full mt-4 btn-primary text-sm"
                >
                  Reservar
                </Button>
              </Card>
            ))}
          </div>
          {services.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-6">*Precios estimados, sujetos a confirmación.</p>
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
              <div className="col-span-full flex justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando barberos...
              </div>
            )}
            {barbersQuery.isError && (
              <p className="col-span-full text-center text-muted-foreground">
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
                  <Button 
                    onClick={() => openBooking(barber.id)}
                    className="w-full btn-primary"
                  >
                    Reservar con {barber.name.split(' ')[0]}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Lo que Dicen Nuestros Clientes</h2>
            <p className="text-muted-foreground text-lg">4.8★ en Google, basado en 497 opiniones</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto reveal-stagger">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="card-premium">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-lg font-semibold mb-3">"{testimonial.quote}"</p>
                <p className="text-foreground mb-4">{testimonial.comment}</p>
                <p className="font-semibold text-accent">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">{testimonial.source}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials Section */}
      <section className="section-padding bg-card/50">
        <div className="container">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">¿Por Qué Barba Azul?</h2>
            <p className="text-muted-foreground text-lg">Razones para elegirnos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 reveal-stagger">
            {differentials.map((diff, idx) => (
              <Card key={idx} className="card-premium text-center group">
                <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125">{diff.icon}</div>
                <h3 className="text-lg font-bold mb-3">{diff.title}</h3>
                <p className="text-muted-foreground text-sm">{diff.description}</p>
              </Card>
            ))}
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
                className="card-premium cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-accent transition-transform duration-300 ${
                      expandedFaq === faq.id ? 'rotate-180' : ''
                    }`}
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
              <MapPin className="w-12 h-12 text-accent mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="text-xl font-bold mb-2">Ubicación</h3>
              <p className="text-muted-foreground">Calle 71 #33-47, Barranquilla, Atlántico</p>
            </Card>
            <Card className="card-premium text-center">
              <Phone className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Teléfono</h3>
              <a href="tel:+573007002929" className="text-accent hover:text-secondary transition-colors duration-200">
                +57 300 700 2929
              </a>
            </Card>
            <Card className="card-premium text-center">
              <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Horarios</h3>
              <p className="text-muted-foreground">Todos los días: 9:00 am - 9:00 pm</p>
            </Card>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden h-96 reveal">
            <iframe
              src="https://www.google.com/maps?q=10.9821957,-74.8109534&z=16&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
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
