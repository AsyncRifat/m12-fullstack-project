import Container from '../../components/Shared/Container';
import Heading from '../../components/Shared/Heading';
import Button from '../../components/Shared/Button/Button';
import PurchaseModal from '../../components/Modal/PurchaseModal';
import { useState } from 'react';
import { useParams } from 'react-router';
import useAuth from '../../hooks/useAuth';
import { useUserRole } from '../../hooks/useUserRole';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { axiosSecure } from '../../hooks/useAxiosSecure';
import EmptyState from '../../components/Shared/EmptyState';

const PlantDetails = () => {
  // const singlePlantData = useLoaderData();
  const { id } = useParams();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [role, isRoleLoading] = useUserRole();

  // tanstack use
  const {
    data: singlePlantData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['plant', id],
    queryFn: async () => {
      const { data } = await axiosSecure(`/plant/${id}`);
      return data;
    },
  });
  // console.log(singlePlantData);

  if (isLoading || isRoleLoading) {
    return <LoadingSpinner />;
  } else if (error) {
    return <EmptyState />;
  }

  if (!singlePlantData || typeof singlePlantData !== 'object') {
    return (
      <p className="text-center text-red-400">
        Sorry Dear Friend ! You are great
      </p>
    );
  }

  const { name, price, image, quantity, category, seller, description } =
    singlePlantData || {};

  const closeModal = () => {
    setIsOpen(false);
  };

  // console.log(role);

  return (
    <Container>
      <div className="mx-auto flex flex-col lg:flex-row justify-between w-full gap-12">
        {/* Header */}
        <div className="flex flex-col gap-6 flex-1">
          <div>
            <div className="w-full overflow-hidden rounded-xl">
              <img
                className="object-cover w-full h-[470px]"
                src={image}
                alt={name}
              />
            </div>
          </div>
        </div>
        <div className="md:gap-10 flex-1">
          {/* Plant Info */}
          <Heading title={name} subtitle={`Category: ${category}`} />
          <hr className="my-6" />
          <div
            className="
          text-lg font-light text-neutral-500"
          >
            {description}
          </div>
          <hr className="my-6" />

          <div
            className="
                text-xl 
                font-semibold 
                flex 
                flex-row 
                items-center
                gap-2
              "
          >
            <div>Seller: {seller?.name}</div>

            <img
              className="rounded-full w-7 h-7 object-cover"
              alt="Avatar"
              referrerPolicy="no-referrer"
              src={seller?.photo}
            />
          </div>
          <hr className="my-6" />
          <div>
            <p
              className="
                gap-4 
                font-light
                text-neutral-500
              "
            >
              Quantity: {quantity} only!
            </p>
          </div>
          <hr className="my-6" />
          <div className="flex justify-between">
            <p className="font-bold text-3xl text-gray-500">Price: ${price}</p>
            <div>
              <Button
                disabled={
                  !user || user?.email === seller.email || role !== 'customer'
                }
                onClick={() => setIsOpen(true)}
                label={user ? 'Purchase' : 'Login to purchase'}
              />
            </div>
          </div>
          <hr className="my-6" />

          <PurchaseModal
            closeModal={closeModal}
            isOpen={isOpen}
            singlePlantData={singlePlantData}
            refetch={refetch}
          />
        </div>
      </div>
    </Container>
  );
};

export default PlantDetails;
