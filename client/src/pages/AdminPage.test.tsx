import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminPage from "./AdminPage";

const mockBooking = {
  id: 1,
  clientName: "Cliente De Prueba",
  clientEmail: "cliente@example.com",
  clientPhone: "3001234567",
  appointmentDate: "2026-08-01",
  appointmentTime: "10:00",
  status: "pending",
  createdAt: new Date(),
  serviceName: "Corte clásico",
  servicePrice: "25000.00",
  barberName: "Wilfredo",
};

let meQueryResult: { data: { role: "admin" } | null; isLoading: boolean } = { data: null, isLoading: false };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      me: { useQuery: () => meQueryResult },
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logout: { useMutation: () => ({ mutate: vi.fn() }) },
      bookings: {
        list: { useQuery: () => ({ data: [mockBooking], isLoading: false, isError: false }) },
        updateStatus: { useMutation: () => ({ mutate: vi.fn() }) },
      },
    },
    useUtils: () => ({ admin: { me: { setData: vi.fn() } } }),
  },
}));

describe("Admin panel", () => {
  it("shows the login form when there is no session", () => {
    meQueryResult = { data: null, isLoading: false };
    render(<AdminPage />);
    expect(screen.getByText("Panel de administración")).toBeInTheDocument();
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("shows the bookings dashboard with real data when logged in", () => {
    meQueryResult = { data: { role: "admin" }, isLoading: false };
    render(<AdminPage />);
    expect(screen.getByText("Cliente De Prueba")).toBeInTheDocument();
    expect(screen.getByText("Wilfredo")).toBeInTheDocument();
    expect(screen.getByText("Corte clásico")).toBeInTheDocument();
    expect(screen.getByText(/3001234567/)).toBeInTheDocument();
  });
});
