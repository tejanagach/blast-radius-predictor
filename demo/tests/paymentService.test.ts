import { processPayment } from '../src/paymentService';

export function testPayment() {
  const result = processPayment(100);
  console.log(result);
}
