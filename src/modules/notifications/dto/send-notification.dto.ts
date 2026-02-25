export class SendNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'payment_received' | 'reminder';
}
