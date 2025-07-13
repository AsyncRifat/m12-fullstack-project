import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useEffect, useState } from 'react';
import { PulseLoader } from 'react-spinners';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const CheckoutForm = ({ totalPrice, orderData, closeModal, refetch }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const axiosSecure = useAxiosSecure();

  const [cardError, setCardError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState();

  // step 2 create payment intent
  useEffect(() => {
    const getClientSecret = async () => {
      // server request
      const { data } = await axiosSecure.post('/create-payment-intent', {
        quantity: orderData?.quantity,
        plantId: orderData?.plantId,
      });
      // console.log(data);
      setClientSecret(data?.clientSecret);
    };
    getClientSecret();
  }, [axiosSecure, orderData]);

  const handleSubmit = async event => {
    setProcessing(true);
    // Block native form submission.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const card = elements.getElement(CardElement);

    if (card == null) {
      return;
    }

    // Use your card Element with other Stripe.js APIs  ##step 1: validate card
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card,
    });

    if (error) {
      console.log('error:', error);
      setCardError(error.message);
      setProcessing(false);
      return;
    } else {
      setCardError(null);
      console.log('[PaymentMethod]', paymentMethod);
    }

    // taka katar pala ebar vai
    // step 3: confirm payment

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: {
          name: user?.displayName,
          email: user?.email,
        },
      },
    });

    if (result.error) {
      setCardError(result.error.message);
      return;
    } else {
      setCardError();
      if (result.paymentIntent.status === 'succeeded') {
        // console.log(result);

        // save order data in db
        orderData.transactionId = result.paymentIntent.id;
        try {
          const { data } = await axiosSecure.post('/order-info', orderData);
          if (data.insertedId) {
            console.log('payment successful');
            toast.success('Order placed Successful');
          }

          const { data: result } = await axiosSecure.patch(
            `/quantity-update/${orderData?.plantId}`,
            { quantityToUpdate: orderData?.quantity, status: 'decrease' }
          );
          console.log(result);
        } catch (error) {
          setCardError(error.message);
        } finally {
          refetch();
          setProcessing(false);
          closeModal();
        }
      }
    }
  };

  return (
    <>
      <h3 className="text-sm mt-5 text-gray-500">Payment Method :</h3>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-100 p-6 rounded-xl shadow-lg w-full max-w-md mx-auto text-gray-700 mt-1 "
      >
        <CardElement className="px-3 py-2.5 border  border-gray-300 rounded-xl" />
        {cardError && <p className="text-red-600 text-xs">{cardError}</p>}
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-4 py-1.5 bg-lime-500 w-full rounded-xl"
        >
          {processing ? (
            <PulseLoader className="pt-0.5" size={10} />
          ) : (
            <p>
              Pay <strong>${totalPrice}</strong>
            </p>
          )}
        </button>
      </form>
    </>
  );
};

export default CheckoutForm;
