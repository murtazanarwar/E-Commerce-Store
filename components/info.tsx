"use client";

import { Product } from "@/types";
import Currency from "@/components/ui/currency";
import Button from "./ui/Button";
import { ShoppingCart } from "lucide-react";
import useCart from "@/hooks/use-cart";
import { MouseEventHandler } from "react";

interface InfoProps {
    data: Product
}

const Info: React.FC<InfoProps> = ({
    data
}) => {
    const cart = useCart();
    const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
        event.stopPropagation();
        cart.addItem(data);
    }
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
            <div className="mt-3 flex items-end justify-between">
                <div className="text-2xl text-gray-900">
                    <Currency value={data?.price} />
                </div>
            </div>
            <hr className="my-4" />
            <div className="flex flex-col gap-y-6">
                <div className="flex items-center gap-x-4">
                    <h3 className="font-semibold text-black">Size:</h3>
                    <div>
                        {data?.size?.name}
                    </div>
                </div>
                <div className="flex items-center gap-x-4">
                    <h3 className="font-semibold text-black">Color:</h3>
                    <div className="h-6 w-6 rounded-full border border-gray-600" style={{
                        backgroundColor: data?.color?.value
                    }} />
                </div>
                <div className="flex gap-x-4">
                    <h3 className="font-semibold text-black">Description:</h3>
                    <div>
                        {data?.description}
                    </div>
                </div>
            </div>
            <div className="mt-10 flex items-center gap-x-3">
                <Button className="flex items-center gap-x-2" onClick={onAddToCart}>
                    Add To Cart
                    <ShoppingCart />
                </Button>
            </div>
        </div>
    )
}

export default Info;