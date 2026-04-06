// src/services/productService.js
import axiosInstance from '../api/axios';

class ProductService {
  createProduct(productData) {
    return axiosInstance.post('/products', productData);
  }

  getAllProducts() {
    return axiosInstance.get('/products');
  }

  getActiveProducts() {
    return axiosInstance.get('/products/active');
  }

  getProductById(id) {
    return axiosInstance.get(`/products/${id}`);
  }

  getProductByCode(productCode) {
    return axiosInstance.get(`/products/code/${productCode}`);
  }

  getProductBom(id) {
    return axiosInstance.get(`/products/${id}/bom`);
  }

  updateProduct(id, productData) {
    return axiosInstance.put(`/products/${id}`, productData);
  }

  manageBom(productId, bomItems) {
    return axiosInstance.post(`/products/${productId}/bom`, bomItems);
  }

  deactivateProduct(id) {
    return axiosInstance.patch(`/products/${id}/deactivate`);
  }
}

export default new ProductService();