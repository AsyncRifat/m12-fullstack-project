import axios from 'axios';

export const imageUpload = async fromImage => {
  const formImageData = new FormData();
  formImageData.append('image', fromImage);

  const { data } = await axios.post(
    `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMBB_API_KEY}`,
    formImageData
  );

  return data?.data?.display_url;
};

export const saveUserInDB = async user => {
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_URL}/user`,
    user
  );

  console.log(data);
};
