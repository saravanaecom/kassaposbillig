import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

console.log("VITE CONFIG LOADED");

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/Brand':      { target: 'http://13.200.71.164:9001/api/BrandApp',      changeOrigin: true, rewrite: path => path.replace(/^\/Brand/, '') },
      '/Category':   { target: 'http://13.200.71.164:9001/api/CategoryApp',   changeOrigin: true, rewrite: path => path.replace(/^\/Category/, '') },
      '/Department': { target: 'http://13.200.71.164:9001/api/DepartmentApp', changeOrigin: true, rewrite: path => path.replace(/^\/Department/, '') },
      '/Supplier':   { target: 'http://13.200.71.164:9001/api/SupplierApp',   changeOrigin: true, rewrite: path => path.replace(/^\/Supplier/, '') },
      '/UOM':        { target: 'http://13.200.71.164:9001/api/UOMApp',        changeOrigin: true, rewrite: path => path.replace(/^\/UOM/, '') },
      '/Location':   { target: 'http://13.200.71.164:9001/api/LocationApp',   changeOrigin: true, rewrite: path => path.replace(/^\/Location/, '') },
      '/ItemMaster': { target: 'http://13.200.71.164:9001/api/ItemMasterApp', changeOrigin: true, rewrite: path => path.replace(/^\/ItemMaster/, '') },
      '/Login':      { target: 'http://13.200.71.164:9001/api/LoginApp',      changeOrigin: true, rewrite: path => path.replace(/^\/Login/, '') },
      '/Content':    { target: 'http://13.200.71.164:9001/api/ContentApp',    changeOrigin: true, rewrite: path => path.replace(/^\/Content/, '') },
    

    }
  }
  
})