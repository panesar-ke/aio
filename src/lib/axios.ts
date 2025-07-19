import Axios from 'axios'
import { env } from '@/env/client'

const axios = Axios.create({
  baseURL: env.VITE_SEC_API_URL || 'http://localhost:8000',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  withXSRFToken: true,
})

export default axios
