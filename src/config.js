import {config} from "dotenv"
config();

export default{
    port: process.env.PORT || 80,
    dbUser: process.env.DB_USER || '',
    dbPassword: process.env.DB_PASSWORD || '',
    dbServer: process.env.DB_SERVER || '',
    dbDatabase: process.env.DB_DATABASE || ''
}

export const MONGODB_URI = process.env['MONGODB_URI']

export const CLOUDINARY_CLOUD_NAME = process.env['CLOUDINARY_CLOUD_NAME']
export const CLOUDINARY_API_KEY = process.env['CLOUDINARY_API_KEY']
export const CLOUDINARY_API_SECRET = process.env['CLOUDINARY_API_SECRET']