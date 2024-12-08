import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { env } = process;

const opayApi = axios.create({
  baseURL: env.OPAY_BASE_URL,
  headers: {
    MerchantId: env.OPAY_MECHANT_ID
  }
});

export default opayApi;
