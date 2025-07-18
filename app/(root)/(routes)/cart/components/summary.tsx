"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Button from "@/components/ui/Button";
import Currency from "@/components/ui/currency";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import useCart from "@/hooks/use-cart";
import { getCurrentUserId } from "@/actions/get-currentuser";

const formSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 characters" })
    .max(15, { message: "Phone number must be at most 15 characters" })
    .regex(/^\+?\d+$/, { message: "Phone number must contain only digits and may start with a +" }),
  address: z
    .string()
    .min(5, { message: "Please enter a valid shipping address" }),
});

type FormValues = z.infer<typeof formSchema>;

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if ((window as any).Razorpay) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
}

const Summary: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const items = useCart((state) => state.items);
  const removeAll = useCart((state) => state.removeAll);
  const [loading, setLoading] = useState<boolean>(false);
  const [handled, setHandled] = useState(false);
  const customerId = getCurrentUserId();
  

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { phoneNumber: "", address: "" },
  });

  useEffect(() => {
    if(handled) return;

    if (searchParams.get("success")) {
      toast.success("Order placed successfully!");
      removeAll();
      router.replace(window.location.pathname);
    }
    if (searchParams.get("canceled")) {
      toast.error("Something went wrong. Please try again.");
      router.replace(window.location.pathname);
    }
  }, [searchParams, removeAll, router]);

  const totalPrice = items.reduce((sum, item) => sum + Number(item.price), 0);

  const onSubmit = form.handleSubmit(async (data) => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
        {
          productIds: items.map((item) => item.id),
          phoneNumber: data.phoneNumber,
          address: data.address,
          customerId,
        }
      );

      const checkout = response.data;

      await loadRazorpayScript();

      const options = {
        key: checkout.razorpayKey,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.razorpayOrderId,
        name: "House Holder Hub",
        description: `Order #${checkout.orderId}`,
        handler: () => {
          // After successful payment, navigate to your status page
          window.location.href = `/cart?success=1`;
        },
        modal: {
          ondismiss: () => {
            window.location.href = `/cart?canceled=1`;
          },
        },
      };

      // @ts-ignore
      new window.Razorpay(options).open();

    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="mt-16 rounded-lg bg-gray-50 p-6 lg:col-span-5 lg:p-8">
      <form onSubmit={onSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>

        <div className="flex justify-between items-center border-t border-gray-200 pt-4">
          <span className="text-base font-medium text-gray-900">Order Total</span>
          <Currency value={totalPrice} />
        </div>

        <Form {...form}>
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 8345678909" {...field} />
                </FormControl>
                <FormDescription>
                  We will contact you once the order is placed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 221B Baker Street, London" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>

        <Button
          type="submit"
          className="w-full mt-4"
          disabled={
            loading || !form.watch("phoneNumber") || !form.watch("address") || items.length === 0
          }
        >
          {loading ? "Processing..." : "Place Order"}
        </Button>
      </form>
    </div>
  );
};

export default Summary;
