import axios from 'axios';
import AddPlantForm from '../../../components/Form/AddPlantForm';
import { imageUpload } from '../../../api/utils';
import useAuth from '../../../hooks/useAuth';
import toast from 'react-hot-toast';
import { useState } from 'react';

const AddPlant = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadImage, setUploadImage] = useState(null);
  const [uploadImageError, setUploadImageError] = useState(false);

  const handleFormSubmit = async e => {
    e.preventDefault();
    setIsUploading(true);
    const form = e.target;
    const name = form?.name?.value;
    const category = form?.category?.value;
    const price = form?.price?.value;
    const quantity = form?.quantity?.value;
    const description = form?.description?.value;

    // const image = form.image?.files[0];
    // console.log(image);

    // // put raw image data in formData--#1
    // const imageFormData = new FormData();
    // imageFormData.append('image', image);

    // // upload image in imgBB server using post request--#2
    // const { data } = await axios.post(
    //   `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMBB_API_KEY}`,
    //   imageFormData
    // );

    // // image url response from imgBB--#3
    // const imageURL = data?.data?.display_url;
    // console.log(imageURL);

    try {
      // const imageURL = await imageUpload(image);
      // console.log(imageURL);

      const plantData = {
        name,
        category,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        description,
        image: uploadImage,
        seller: {
          name: user?.displayName,
          email: user?.email,
          photo: user?.photoURL,
        },
      };
      // console.log(plantData);
      console.table(plantData);

      // send data in server side to db
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/add-plant`,
        plantData
      );
      if (data?.insertedId && data?.acknowledged === true) {
        toast.success('Added your product, Yee!!');
        form.reset();
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadingImage = async e => {
    e.preventDefault();
    const image = e.target.files[0];

    try {
      const imageURL = await imageUpload(image);
      setUploadImage(imageURL);
      // console.log(imageURL);
    } catch (error) {
      setUploadImageError(error);
      console.log(error);
    }
  };

  return (
    <div>
      {/* Form */}
      <AddPlantForm
        handleFormSubmit={handleFormSubmit}
        isUploading={isUploading}
        handleUploadingImage={handleUploadingImage}
        uploadImage={uploadImage}
        uploadImageError={uploadImageError}
      />
    </div>
  );
};

export default AddPlant;
