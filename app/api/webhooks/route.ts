import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";

import {
    upsertProductRecord,
    upsertPriceRecord,
    manageSubscriptionStatusChange
} from "@/lib/supabaseAdmin";

const relevantEvents = new Set([
    'product.created',
    'product.updated',
    'price.created',
    'price.updated', // fixed typo from 'price.update'
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated', // fixed typo from 'customer.subscrition.updated'
    'customer.subscription.deleted'
]);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get('Stripe-Signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
        if (!sig || !webhookSecret) return;
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret) as Stripe.DiscriminatedEvent;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log('Error message: ' + error.message);
            return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
        }
        console.log('Unknown error:', error);
        return new NextResponse('Webhook Error', { status: 400 });
    }

    if (relevantEvents.has(event.type)) {
        try {
            switch (event.type) {
                case 'product.created':
                case 'product.updated':
                    await upsertProductRecord(event.data.object as Stripe.Product);
                    break;
                case 'price.created':
                // @ts-expect-error Stripe typings may lag here
                case 'price.updated':
                    await upsertPriceRecord(event.data.object as Stripe.Price);
                    break;
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    const subscription = event.data.object as Stripe.Subscription;
                    await manageSubscriptionStatusChange(
                        subscription.id,
                        subscription.customer as string,
                        event.type === 'customer.subscription.created'
                    );
                    break;
                case 'checkout.session.completed':
                    const checkoutSession = event.data.object as Stripe.Checkout.Session;
                    if (checkoutSession.mode === 'subscription') {
                        const subscriptionId = checkoutSession.subscription;
                        await manageSubscriptionStatusChange(
                            subscriptionId as string,
                            checkoutSession.customer as string,
                            true
                        );
                    }
                    break;
                default:
                    throw new Error('Unhandled relevant event!');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.log(error.message);
                return new NextResponse('Webhook Error: ' + error.message, { status: 400 });
            }
            console.log('Unknown error:', error);
            return new NextResponse('Webhook Error', { status: 400 });
        }
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
