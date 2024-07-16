import axios from 'axios';

export const uploadImage = async (img) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/get-upload-url`);
        const uploadUrl = response.data.uploadURL;

        await axios.put(uploadUrl, img, {
            headers: {
                'Content-Type': img.type
            }
        });

        const imgUrl = uploadUrl.split("?")[0];
        return imgUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
