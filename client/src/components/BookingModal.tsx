import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set (e.g. opened from a barber's card), pre-selects that barber. */
  initialBarberId?: number;
}

export default function BookingModal({ isOpen, onClose, initialBarberId }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isOpen && initialBarberId) {
      setSelectedBarber(String(initialBarberId));
    }
  }, [isOpen, initialBarberId]);

  const servicesQuery = trpc.services.list.useQuery();
  const barbersQuery = trpc.barbers.list.useQuery();
  const createBookingMutation = trpc.bookings.create.useMutation();
  const bookingsForDateQuery = trpc.bookings.getByDate.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate }
  );

  const services = servicesQuery.data || [];
  const barbers = barbersQuery.data || [];

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];

  // Slots already taken for the barber + date currently selected. Computed
  // client-side from bookings.getByDate so people can't even pick a slot
  // that's gone — the server-side check in db.ts is the real guarantee,
  // this is just so they don't hit that error in the first place.
  const takenTimes = useMemo(() => {
    if (!bookingsForDateQuery.data || !selectedBarber) return new Set<string>();
    return new Set(
      bookingsForDateQuery.data
        .filter((b) => b.barberId === parseInt(selectedBarber) && b.status !== 'cancelled')
        .map((b) => b.appointmentTime)
    );
  }, [bookingsForDateQuery.data, selectedBarber]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await createBookingMutation.mutateAsync({
        serviceId: parseInt(selectedService),
        barberId: parseInt(selectedBarber),
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
      });
      toast.success('¡Cita reservada exitosamente!');
      onClose();
      setStep(1);
      setSelectedService('');
      setSelectedBarber('');
      setSelectedDate('');
      setSelectedTime('');
      setName('');
      setEmail('');
      setPhone('');
    } catch (error) {
      console.error('Error booking:', error);
      const code = (error as { data?: { code?: string } })?.data?.code;
      if (code === 'CONFLICT') {
        toast.error('Ese horario ya fue reservado. Elige otra hora.');
        bookingsForDateQuery.refetch();
        setStep(3);
      } else {
        toast.error('Error al reservar la cita. Intenta de nuevo.');
      }
    }
  };

  const getServiceName = () => {
    return services.find(s => s.id === parseInt(selectedService))?.name || '';
  };

  const getBarberName = () => {
    return barbers.find(b => b.id === parseInt(selectedBarber))?.name || '';
  };

  const handleClose = () => {
    onClose();
    setStep(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Reserva tu Cita</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">Paso {step} de 5</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-accent' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selecciona un Servicio</h3>
              {servicesQuery.isLoading ? (
                <p className="text-muted-foreground" aria-live="polite">Cargando servicios…</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <Card
                      key={service.id}
                      role="radio"
                      aria-checked={selectedService === service.id.toString()}
                      tabIndex={0}
                      className={`p-4 cursor-pointer border-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        selectedService === service.id.toString()
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                      onClick={() => setSelectedService(service.id.toString())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedService(service.id.toString());
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-accent">${Math.round(parseFloat(service.price)).toLocaleString('es-CO')} COP</p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 ${
                          selectedService === service.id.toString()
                            ? 'bg-accent border-accent'
                            : 'border-border'
                        }`} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Barber */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selecciona tu Barbero</h3>
              {barbersQuery.isLoading ? (
                <p className="text-muted-foreground" aria-live="polite">Cargando barberos…</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {barbers.map((barber) => (
                    <Card
                      key={barber.id}
                      role="radio"
                      aria-checked={selectedBarber === barber.id.toString()}
                      tabIndex={0}
                      className={`p-4 cursor-pointer border-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        selectedBarber === barber.id.toString()
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                      onClick={() => setSelectedBarber(barber.id.toString())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedBarber(barber.id.toString());
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{barber.name}</p>
                          <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 ${
                          selectedBarber === barber.id.toString()
                            ? 'bg-accent border-accent'
                            : 'border-border'
                        }`} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selecciona Fecha y Hora</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-background border-border"
                    autoComplete="off"
                  />
                </div>
                <fieldset className="space-y-3">
                  <legend className="font-semibold text-sm">Hora Disponible</legend>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {timeSlots.map((time) => {
                      const isTaken = takenTimes.has(time);
                      return (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? 'default' : 'outline'}
                          disabled={isTaken}
                          title={isTaken ? 'Ese horario ya está reservado' : undefined}
                          className={`text-sm ${
                            isTaken
                              ? 'opacity-40 cursor-not-allowed line-through'
                              : selectedTime === time
                              ? 'bg-accent text-accent-foreground'
                              : 'border-border hover:border-accent'
                          }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                  </fieldset>
                </div>
              </div>
            )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumen de tu Reserva</h3>
              <Card className="p-4 bg-background border-border space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span className="font-semibold text-accent">{getServiceName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barbero:</span>
                  <span className="font-semibold text-accent">{getBarberName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-semibold">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hora:</span>
                  <span className="font-semibold">{selectedTime}</span>
                </div>
              </Card>
            </div>
          )}

          {/* Step 5: Contact Info */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información de Contacto</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background border-border"
                    placeholder="Tu nombre completo…"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-border"
                    placeholder="tu@email.com…"
                    autoComplete="email"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-background border-border"
                    placeholder="+57 300 000 0000…"
                    autoComplete="tel"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between pt-4">
            <Button
              onClick={handlePrev}
              variant="outline"
              type="button"
              className={step === 1 ? 'opacity-50 cursor-not-allowed' : ''}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Anterior
            </Button>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                type="button"
                className="btn-primary"
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 2 && !selectedBarber) ||
                  (step === 3 && (!selectedDate || !selectedTime))
                }
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                type="button"
                className="btn-primary"
                disabled={!name || !email || !phone || createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? 'Confirmando…' : 'Confirmar Reserva'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
