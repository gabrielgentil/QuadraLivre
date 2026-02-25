export class CreateAvailabilityDto {
  courtId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}
