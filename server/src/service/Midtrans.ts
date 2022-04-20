import { users } from '@prisma/client'
import axios from 'axios'

type Status = 'authorize' | 'partial_refund' | 'refund' | 'cancel' | 'expire' | 'pending' | 'settlement' | 'deny' | 'capture'

export type TransactionDetails = {
  status_code: string,
  status_message: string,
  transaction_time: string,
  settlement_time?: string,
  transaction_status: Status
}
export class Midtrans {

  public constructor(
    private req = axios.create({
      auth: {
        username: process.env.MIDTRANS_SERVER_KEY,
        password: ''
      }
    })
  ) {
    if (!process.env.MIDTRANS_SERVER_KEY) {
      throw new Error('Please define Midtrans server key first')
    }
  }

  public async getPaymentLink(_user: users, _amount: number): Promise<{ token: string, redirect_url: string }> {
    throw new Error('Not implemented')
    // if (!user.midtrans_id) {
    //   throw new Error('Please generate order ID first')
    // }
    // const { data } = await this.req.post<{ token: string, redirect_url: string }>('https://app.midtrans.com/snap/v1/transactions', {
    //   transaction_details: {
    //     order_id: user.midtrans_id,
    //     gross_amount: amount
    //   },
    //   customer_details: {
    //     first_name: user.name,
    //     email: user.email,
    //     phone: user.username
    //   }
    // })
    // return data
  }

  public async getTransactionStatus(orderId: string): Promise<TransactionDetails> {
    const { data } = await this.req.get<TransactionDetails>(`https://api.midtrans.com/v2/${orderId}/status`)
    return data
  }
}