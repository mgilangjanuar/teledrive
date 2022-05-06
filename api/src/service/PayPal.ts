import { users } from '@prisma/client'
import axios from 'axios'
import QueryString from 'qs'

interface AccessToken {
  scope: string,
  access_token: string,
  token_type: string,
  app_id: string,
  expires_in: number,
  nonce: string
}

interface CreateSubscription {
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED',
  id: string,
  create_time: string,
  links: {
    href: string,
    rel: 'approve' | 'edit' | 'self',
    method: string
  }[]
}

export interface SubscriptionDetails {
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED',
  id: string,
  plan_id: string,
  start_time: string,
  quantity: string | number,
  shipping_amount: {
    currency_code: 'USD',
    value: string
  },
  subscriber: {
    email_address?: string,
    name: {
      given_name: string,
      surname: string
    }
  },
  plan_overridden: boolean,
  create_time: string,
  billing_info?: {
    outstanding_balance: {
      currency_code: string,
      value: string
    },
    cycle_executions: {
      tenure_type: string,
      sequence: number,
      cycles_completed: number,
      cycles_remaining: number,
      current_pricing_scheme_version: number,
      total_cycles: number
    }[],
    last_payment: {
      amount: {
        currency_code: string,
        value: string
      },
      time: string
    },
    failed_payments_count: number
  },
  links: {
    href: string,
    rel: 'approve' | 'edit' | 'self',
    method: string
  }[]
}

export class PayPal {

  public constructor(
    private req = axios.create({
      baseURL: 'https://api-m.paypal.com/v1'
    }),
    private accessToken?: string
  ) {}

  public async getAccessToken(): Promise<AccessToken> {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('Please define PayPal credentials first')
    }

    const { data } = await this.req.post<AccessToken>('/oauth2/token', QueryString.stringify({
      grant_type: 'client_credentials'
    }), {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET
      }
    })
    this.accessToken = data.access_token
    return data
  }

  public async createSubscription(user: users): Promise<CreateSubscription> {
    if (!process.env.PAYPAL_PLAN_PREMIUM_ID) {
      throw new Error('Please define PayPal plan ID first')
    }

    const hit = async () => await this.req.post<CreateSubscription>('/billing/subscriptions', {
      plan_id: process.env.PAYPAL_PLAN_PREMIUM_ID,
      subscriber: {
        name: {
          given_name: user.name,
          surname: user.username
        },
        email_address: user.email
      }
    }, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!this.accessToken) {
      await this.getAccessToken()
    }

    try {
      const { data } = await hit()
      return data
    } catch (error) {
      await this.getAccessToken()
      const { data } = await hit()
      return data
    }
  }

  public async getSubscription(id: string): Promise<SubscriptionDetails> {
    const hit = async () => await this.req.get<SubscriptionDetails>(`/billing/subscriptions/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!this.accessToken) {
      await this.getAccessToken()
    }

    try {
      const { data } = await hit()
      return data
    } catch (error) {
      await this.getAccessToken()
      const { data } = await hit()
      return data
    }
  }

  public async cancelSubscription(id: string, reason: string): Promise<void> {
    const hit = async () => await this.req.post<void>(`/billing/subscriptions/${id}/cancel`, { reason }, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!this.accessToken) {
      await this.getAccessToken()
    }

    try {
      const { data } = await hit()
      return data
    } catch (error) {
      await this.getAccessToken()
      const { data } = await hit()
      return data
    }
  }
}