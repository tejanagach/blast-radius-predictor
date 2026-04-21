import { processPayment } from './paymentService';

export function createCheckout(amount: number) {
  return processPayment(amount);
}
