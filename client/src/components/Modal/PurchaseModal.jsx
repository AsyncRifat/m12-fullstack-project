import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

// stripe payment checkout
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../Form/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK_KEY);

const PurchaseModal = ({ closeModal, isOpen, singlePlantData }) => {
  const { user } = useAuth();

  // Total Price Calculation
  const { name, price, quantity, category, seller, _id, image } =
    singlePlantData || {};

  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(price);

  const [orderData, setOrderData] = useState({
    // customer: {
    //   name: user?.displayName,
    //   email: user?.email,
    //   image: user?.photoURL,
    // },
    seller,
    plantId: _id,
    quantity: 1,
    price: price,
    plantName: name,
    plantCategory: category,
    plantImage: image,
  });

  useEffect(() => {
    if (user) {
      setOrderData(prev => {
        return {
          ...prev,
          customer: {
            name: user?.displayName,
            email: user?.email,
            image: user?.photoURL,
          },
        };
      });
    }
  }, [user]);

  const handleQuantity = value => {
    const totalQuantity = parseInt(value);

    if (totalQuantity > quantity) {
      return toast.error('You can not purchase more');
    }

    // console.log(typeof totalQuantity, totalQuantity);
    setSelectedQuantity(totalQuantity);

    const totalCalculatePrice = totalQuantity * price;
    setTotalPrice(totalCalculatePrice);

    setOrderData(prev => {
      return {
        ...prev,
        price: totalCalculatePrice,
        quantity: totalQuantity,
      };
    });
  };

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-10 focus:outline-none "
      onClose={closeModal}
    >
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-md bg-white p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0 shadow-xl rounded-2xl"
          >
            <DialogTitle
              as="h3"
              className="text-lg font-medium text-center leading-6 text-gray-900"
            >
              Review Info Before Purchase
            </DialogTitle>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Plant: {name}</p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Category: {category}</p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Customer: {seller?.name}</p>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Price: ${price} <small>/per unit</small>
              </p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Available Quantity: {quantity}
              </p>
            </div>
            <hr className="my-2 text-gray-300" />

            <p className="font-medium">Order Info :</p>

            <div className="mt-2">
              <input
                value={selectedQuantity}
                onChange={e => handleQuantity(e.target.value)}
                type="number"
                min={1}
                max={quantity}
                className="px-3 py-1 w-1/3 bg-gray-100 rounded-lg focus:bg-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-lime-500 focus:outline-none"
              />
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Selected Quantity: {selectedQuantity}
              </p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Total price: ${totalPrice}
              </p>
            </div>

            {/* Stripe checkout from */}

            <Elements stripe={stripePromise}>
              <CheckoutForm
                totalPrice={totalPrice}
                orderData={orderData}
                closeModal={closeModal}
              />
            </Elements>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default PurchaseModal;
