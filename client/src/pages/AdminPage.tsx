import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const STATUS_VARIANT: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
};

function formatCOP(price: string | null) {
  if (!price) return '—';
  return `$${Math.round(parseFloat(price)).toLocaleString('es-CO')} COP`;
}

export default function AdminPage() {
  const meQuery = trpc.admin.me.useQuery();

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return meQuery.data ? (
    <AdminDashboard />
  ) : (
    <AdminLogin onSuccess={() => meQuery.refetch()} />
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: () => onSuccess(),
    onError: (err) => toast.error(err.message || 'No se pudo iniciar sesión.'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="card-premium w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1 text-center">Panel de administración</h1>
        <p className="text-muted-foreground text-sm text-center mb-6">Barba Azul</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginMutation.mutate({ username, password });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="admin-username">Usuario</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Contraseña</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full btn-primary" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const utils = trpc.useUtils();
  const bookingsQuery = trpc.admin.bookings.list.useQuery();

  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess: () => utils.admin.me.setData(undefined, null),
  });

  const updateStatusMutation = trpc.admin.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Reserva actualizada');
      bookingsQuery.refetch();
    },
    onError: (err) => toast.error(err.message || 'No se pudo actualizar la reserva.'),
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Reservas</h1>
            <p className="text-muted-foreground text-sm">Barba Azul — panel de administración</p>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
          </Button>
        </div>

        {bookingsQuery.isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando reservas...
          </div>
        )}

        {bookingsQuery.isError && (
          <p className="text-center text-muted-foreground py-16">No se pudieron cargar las reservas.</p>
        )}

        {bookingsQuery.data && bookingsQuery.data.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Todavía no hay reservas.</p>
        )}

        {bookingsQuery.data && bookingsQuery.data.length > 0 && (
          <Card className="card-premium overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Barbero</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cambiar estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsQuery.data.map((b) => {
                  const status = b.status as BookingStatus;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>{b.appointmentDate}</TableCell>
                      <TableCell>{b.appointmentTime}</TableCell>
                      <TableCell className="font-medium">{b.clientName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        <div>{b.clientPhone}</div>
                        <div>{b.clientEmail}</div>
                      </TableCell>
                      <TableCell>
                        {b.serviceName ?? '—'}
                        {b.servicePrice && (
                          <div className="text-xs text-muted-foreground">{formatCOP(b.servicePrice)}</div>
                        )}
                      </TableCell>
                      <TableCell>{b.barberName ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[status] ?? 'secondary'}>
                          {STATUS_LABELS[status] ?? b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: b.id, status: value as BookingStatus })
                          }
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
