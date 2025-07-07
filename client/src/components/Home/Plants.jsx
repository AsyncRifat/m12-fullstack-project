import Card from './Card';
import Container from '../Shared/Container';
import { useLoaderData } from 'react-router';
import EmptyState from '../Shared/EmptyState';

const Plants = () => {
  const plantsData = useLoaderData();
  // console.log(plantsData);

  return (
    <Container>
      {plantsData && plantsData.length > 0 ? (
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
          {/* <Card /> */}
          {plantsData.map(singlePlant => (
            <Card key={singlePlant._id} singlePlant={singlePlant} />
          ))}
        </div>
      ) : (
        <EmptyState message={'No Plants data available'} />
      )}
    </Container>
  );
};

export default Plants;
