import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { env } = process;

const paystackApi = axios.create({
  baseURL: env?.PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${env?.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json"
  }
});

export default paystackApi;
