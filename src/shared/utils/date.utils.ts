import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMinutes,
  isBefore,
  isAfter,
  isEqual,
  differenceInMinutes,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export class DateUtils {
  /**
   * Converte uma data UTC para o timezone especificado
   */
  static toTimezone(date: Date, timezone = DEFAULT_TIMEZONE): Date {
    return toZonedTime(date, timezone);
  }

  /**
   * Converte uma data do timezone especificado para UTC
   */
  static toUTC(date: Date, timezone = DEFAULT_TIMEZONE): Date {
    return fromZonedTime(date, timezone);
  }

  /**
   * Formata uma data para exibição
   */
  static formatDisplay(date: Date, formatStr = 'dd/MM/yyyy'): string {
    return format(date, formatStr, { locale: ptBR });
  }

  /**
   * Formata uma data com hora para exibição
   */
  static formatDateTime(date: Date, formatStr = "dd/MM/yyyy 'às' HH:mm"): string {
    return format(date, formatStr, { locale: ptBR });
  }

  /**
   * Formata apenas a hora
   */
  static formatTime(date: Date): string {
    return format(date, 'HH:mm');
  }

  /**
   * Parse de string ISO para Date
   */
  static parseISO(dateString: string): Date {
    return parseISO(dateString);
  }

  /**
   * Início do dia
   */
  static startOfDay(date: Date): Date {
    return startOfDay(date);
  }

  /**
   * Fim do dia
   */
  static endOfDay(date: Date): Date {
    return endOfDay(date);
  }

  /**
   * Início do mês
   */
  static startOfMonth(date: Date): Date {
    return startOfMonth(date);
  }

  /**
   * Fim do mês
   */
  static endOfMonth(date: Date): Date {
    return endOfMonth(date);
  }

  /**
   * Início da semana (domingo)
   */
  static startOfWeek(date: Date): Date {
    return startOfWeek(date, { locale: ptBR });
  }

  /**
   * Fim da semana (sábado)
   */
  static endOfWeek(date: Date): Date {
    return endOfWeek(date, { locale: ptBR });
  }

  /**
   * Adiciona minutos a uma data
   */
  static addMinutes(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  }

  /**
   * Verifica se uma data é antes de outra
   */
  static isBefore(date: Date, dateToCompare: Date): boolean {
    return isBefore(date, dateToCompare);
  }

  /**
   * Verifica se uma data é depois de outra
   */
  static isAfter(date: Date, dateToCompare: Date): boolean {
    return isAfter(date, dateToCompare);
  }

  /**
   * Verifica se duas datas são iguais
   */
  static isEqual(date: Date, dateToCompare: Date): boolean {
    return isEqual(date, dateToCompare);
  }

  /**
   * Diferença em minutos entre duas datas
   */
  static differenceInMinutes(dateLeft: Date, dateRight: Date): number {
    return differenceInMinutes(dateLeft, dateRight);
  }

  /**
   * Gera slots de horário baseado no horário de funcionamento
   */
  static generateTimeSlots(
    openTime: string,
    closeTime: string,
    slotDuration: number
  ): string[] {
    const slots: string[] = [];
    const [openHourStr, openMinStr] = openTime.split(':');
    const [closeHourStr, closeMinStr] = closeTime.split(':');

    const openHour = parseInt(openHourStr || '0', 10);
    const openMin = parseInt(openMinStr || '0', 10);
    const closeHour = parseInt(closeHourStr || '0', 10);
    const closeMin = parseInt(closeMinStr || '0', 10);

    let currentMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    while (currentMinutes < closeMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
      currentMinutes += slotDuration;
    }

    return slots;
  }

  /**
   * Converte string de hora para minutos desde meia-noite
   */
  static timeToMinutes(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  }

  /**
   * Converte minutos desde meia-noite para string de hora
   */
  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Verifica se dois intervalos de tempo se sobrepõem
   */
  static doTimesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const start1Min = this.timeToMinutes(start1);
    const end1Min = this.timeToMinutes(end1);
    const start2Min = this.timeToMinutes(start2);
    const end2Min = this.timeToMinutes(end2);

    return start1Min < end2Min && start2Min < end1Min;
  }

  /**
   * Retorna o dia da semana em formato curto (mon, tue, etc)
   */
  static getDayOfWeek(date: Date): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[date.getDay()] || 'sun';
  }

  /**
   * Adiciona minutos a um horário no formato HH:mm
   */
  static addMinutesToTime(time: string, minutesToAdd: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutesToAdd;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * Verifica se dois intervalos de tempo se sobrepõem
   */
  static timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    return this.doTimesOverlap(start1, end1, start2, end2);
  }

  /**
   * Formata uma data para o formato YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }
}
