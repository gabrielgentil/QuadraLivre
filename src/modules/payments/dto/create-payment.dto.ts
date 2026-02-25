export class CreatePaymentDto {
  bookingId: string;
  amount: number;
  method: 'pix' | 'credit_card' | 'debit_card';
}
