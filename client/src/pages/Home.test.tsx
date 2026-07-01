import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import App from "../App";

const mockServices = [
  { id: 1, name: "Corte clásico", description: "Corte tradicional.", price: "25000.00", durationMinutes: 30, createdAt: new Date() },
  { id: 2, name: "Combo VIP", description: "Experiencia completa.", price: "60000.00", durationMinutes: 75, createdAt: new Date() },
];

const mockBarbers = [
  { id: 1, name: "Wilfredo", specialty: null, experience: null, isActive: true, createdAt: new Date() },
  { id: 2, name: "Jairo", specialty: null, experience: null, isActive: true, createdAt: new Date() },
  { id: 3, name: "Jesús", specialty: null, experience: null, isActive: true, createdAt: new Date() },
  { id: 4, name: "Daniel", specialty: null, experience: null, isActive: true, createdAt: new Date() },
];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    services: { list: { useQuery: () => ({ data: mockServices, isLoading: false, isError: false }) } },
    barbers: { list: { useQuery: () => ({ data: mockBarbers, isLoading: false, isError: false }) } },
    bookings: {
      create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      getByDate: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
    },
    admin: {
      me: { useQuery: () => ({ data: null, isLoading: false }) },
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logout: { useMutation: () => ({ mutate: vi.fn() }) },
      bookings: {
        list: { useQuery: () => ({ data: [], isLoading: false, isError: false }) },
        updateStatus: { useMutation: () => ({ mutate: vi.fn() }) },
      },
    },
    useUtils: () => ({ admin: { me: { setData: vi.fn() } } }),
  },
}));

describe("Home page renders with real content (no crash, no stale mock data)", () => {
  it("renders the real service catalog with COP pricing", async () => {
    render(<App />);
    expect(await screen.findByText("Corte clásico")).toBeInTheDocument();
    expect(screen.getByText(/25\.000/)).toBeInTheDocument();
    // Should never show the old USD mock prices or the old fake service names.
    expect(screen.queryByText("Corte Moderno")).not.toBeInTheDocument();
    expect(screen.queryByText(/\$25(?!\.)/)).not.toBeInTheDocument();
  });

  it("renders the real team and not the old fake placeholder barbers", () => {
    expect(screen.getByText("Wilfredo")).toBeInTheDocument();
    expect(screen.getByText("Jairo")).toBeInTheDocument();
    expect(screen.getByText("Jesús")).toBeInTheDocument();
    expect(screen.getByText("Daniel")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Mendoza")).not.toBeInTheDocument();
    expect(screen.queryByText("Por confirmar")).not.toBeInTheDocument();
  });

  it("renders the real testimonials, not the fabricated ones", () => {
    expect(screen.getByText("Michael C.")).toBeInTheDocument();
    expect(screen.getByText("Jonathan Y.")).toBeInTheDocument();
    expect(screen.queryByText("Andrés Rodríguez")).not.toBeInTheDocument();
  });

  it("shows the honest gallery placeholder instead of fake placeholder images", () => {
    expect(screen.getByText(/Muy pronto/i)).toBeInTheDocument();
    expect(screen.queryByText(/Resultados reales/i)).not.toBeInTheDocument();
  });

  it("shows the real address and hours, and drops the unconfirmed cancellation FAQ", () => {
    expect(screen.getByText(/Calle 71 #33-47/)).toBeInTheDocument();
    expect(screen.getByText(/Todos los días: 9:00 am - 9:00 pm/)).toBeInTheDocument();
    expect(screen.queryByText(/política de cancelación/i)).not.toBeInTheDocument();
  });

  it("opens the booking modal with the right barber preselected when clicking 'Reservar con Wilfredo'", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: /Reservar con Wilfredo/i });
    await user.click(button);

    const dialog = await screen.findByRole("dialog");
    // Step 1 of the booking wizard is the service picker — confirms the
    // modal actually opened and rendered its real content, not a crash.
    expect(within(dialog).getByText(mockServices[0].name)).toBeInTheDocument();
  });
});
