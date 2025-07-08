import {v2 as cloudinary} from 'cloudinary'
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config.js'

cloudinary.config({ 
  cloud_name: CLOUDINARY_CLOUD_NAME, 
  api_key: CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET
});

export async function uploadImage(filePath) {
    return await cloudinary.uploader.upload(filePath)
}

export async function removeImage(idImage) {
  return await cloudinary.uploader.destroy(idImage)
}