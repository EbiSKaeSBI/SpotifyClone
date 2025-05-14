"use client";

import Modal from "./Modal";
import { Price, ProductWithPrice } from "@/types";
import Button from "./Button";

interface SubscribeModalProps {
    products: ProductWithPrice[];
}

const formatPrice = (price: Price) => {
    const priceString = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currency,
        minimumFractionDigits: 0
    }).format((price?.unit_amount || 0) / 100);

    return priceString;
}


const SubscribeModal: React.FC<SubscribeModalProps> = ({
    products
}) => {
    let content = (
        <div className="text-center">
            No producst available.
        </div>
    )

    if (products.length) {
        content = (
            <div>
                {products.map((product) => {
                    if (!product.prices?.length) {
                        return (
                            <div key={product.id}>
                                No prices available
                            </div>
                        )
                    }

                    return product.prices.map((price) => (
                        <Button key={price.id}>
                            {`Subscribe for ${formatPrice(price)} a ${price.interval}`}
                        </Button>
                    ))
                })}
            </div>
        )
    }
    return (
        <Modal
            title="Only for preium users"
            description="Listen to music with Spotify Premium"
            isOpen={false}
            onChange={() => { }}
        >
            {content}
        </Modal>
    );
};

export default SubscribeModal;