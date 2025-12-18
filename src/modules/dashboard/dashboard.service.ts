import { prisma } from '../../config';
import { ApiError, DateUtils } from '../../shared/utils';
import { AppointmentStatus } from '@prisma/client';

interface DashboardStats {
  today: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
  };
  week: {
    total: number;
    revenue: number;
  };
  month: {
    total: number;
    revenue: number;
    newCustomers: number;
  };
}

interface TodayAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  customer: { id: string; name: string; phone: string };
  service: { id: string; name: string; price: unknown };
}

export class DashboardService {
  /**
   * Retorna estatísticas do dashboard
   */
  async getStats(businessId: string): Promise<DashboardStats> {
    // Usa a data em formato string para evitar problemas de timezone
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const today = new Date(todayStr + 'T00:00:00.000Z');

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Domingo

    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    // Agendamentos de hoje
    const todayAppointments = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        businessId,
        date: today,
      },
      _count: true,
    });

    const todayStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
    };

    todayAppointments.forEach(apt => {
      todayStats.total += apt._count;
      if (apt.status === 'PENDING') todayStats.pending = apt._count;
      if (apt.status === 'CONFIRMED') todayStats.confirmed = apt._count;
      if (apt.status === 'COMPLETED') todayStats.completed = apt._count;
    });

    // Agendamentos da semana (todos os status exceto cancelados)
    const weekAppointmentsAll = await prisma.appointment.count({
      where: {
        businessId,
        date: { gte: weekStart, lte: today },
        status: { notIn: ['CANCELLED'] },
      },
    });

    // Agendamentos COMPLETED da semana para receita
    const weekAppointmentsCompleted = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: weekStart, lte: today },
        status: 'COMPLETED',
      },
      include: {
        service: { select: { price: true } },
      },
    });

    const weekRevenue = weekAppointmentsCompleted.reduce((sum, apt) => {
      return sum + Number(apt.service.price);
    }, 0);

    // Agendamentos do mês
    const monthAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: monthStart },
        status: 'COMPLETED',
      },
      include: {
        service: { select: { price: true } },
      },
    });

    const monthRevenue = monthAppointments.reduce((sum, apt) => {
      return sum + Number(apt.service.price);
    }, 0);

    // Novos clientes do mês
    const newCustomers = await prisma.customer.count({
      where: {
        businessId,
        createdAt: { gte: monthStart },
      },
    });

    return {
      today: todayStats,
      week: {
        total: weekAppointmentsAll,
        revenue: weekRevenue,
      },
      month: {
        total: monthAppointments.length,
        revenue: monthRevenue,
        newCustomers,
      },
    };
  }

  /**
   * Retorna agendamentos de hoje
   */
  async getTodayAppointments(businessId: string): Promise<TodayAppointment[]> {
    // Usa a data em formato string para evitar problemas de timezone
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const today = new Date(todayStr + 'T00:00:00.000Z');

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: today,
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments as TodayAppointment[];
  }

  /**
   * Retorna próximos agendamentos (próximos 7 dias)
   */
  async getUpcomingAppointments(businessId: string, limit = 10) {
    // Usa a data em formato string para evitar problemas de timezone
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const today = new Date(todayStr + 'T00:00:00.000Z');

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: today, lte: weekFromNow },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: limit,
    });

    return appointments;
  }

  /**
   * Retorna dados para gráfico de agendamentos por dia da semana atual
   */
  async getWeeklyChartData(businessId: string) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const today = new Date(todayStr + 'T00:00:00.000Z');

    // Início da semana (domingo)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: weekStart, lte: today },
        status: { notIn: ['CANCELLED'] },
      },
      select: { date: true },
    });

    // Agrupar por dia da semana
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekData = days.map((name, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      const count = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toISOString().split('T')[0] === dayDate.toISOString().split('T')[0];
      }).length;
      return { name, value: count };
    });

    return weekData;
  }

  /**
   * Retorna dados para gráfico de receita dos últimos 6 meses
   */
  async getMonthlyRevenueData(businessId: string) {
    const now = new Date();
    const monthsData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId,
          date: { gte: monthDate, lte: monthEnd },
          status: 'COMPLETED',
        },
        include: {
          service: { select: { price: true } },
        },
      });

      const revenue = appointments.reduce((sum, apt) => sum + Number(apt.service.price), 0);
      const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      monthsData.push({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        value: revenue,
      });
    }

    return monthsData;
  }

  /**
   * Retorna estatísticas comparativas (mês atual vs anterior)
   */
  async getComparativeStats(businessId: string) {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const lastMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0));

    // Mês atual
    const currentMonthAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: currentMonthStart },
        status: 'COMPLETED',
      },
      include: { service: { select: { price: true } } },
    });

    // Mês anterior
    const lastMonthAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: lastMonthStart, lte: lastMonthEnd },
        status: 'COMPLETED',
      },
      include: { service: { select: { price: true } } },
    });

    const currentRevenue = currentMonthAppointments.reduce((sum, apt) => sum + Number(apt.service.price), 0);
    const lastRevenue = lastMonthAppointments.reduce((sum, apt) => sum + Number(apt.service.price), 0);

    // Clientes
    const currentCustomers = await prisma.customer.count({
      where: { businessId, createdAt: { gte: currentMonthStart } },
    });
    const lastCustomers = await prisma.customer.count({
      where: { businessId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    });

    // Total de clientes
    const totalCustomers = await prisma.customer.count({
      where: { businessId },
    });

    return {
      revenue: {
        current: currentRevenue,
        previous: lastRevenue,
        percentChange: lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0,
      },
      appointments: {
        current: currentMonthAppointments.length,
        previous: lastMonthAppointments.length,
        percentChange: lastMonthAppointments.length > 0
          ? ((currentMonthAppointments.length - lastMonthAppointments.length) / lastMonthAppointments.length) * 100
          : 0,
      },
      customers: {
        current: currentCustomers,
        previous: lastCustomers,
        total: totalCustomers,
        percentChange: lastCustomers > 0 ? ((currentCustomers - lastCustomers) / lastCustomers) * 100 : 0,
      },
    };
  }
}

export const dashboardService = new DashboardService();
