// src/services/batchService.js
import axiosInstance from '../api/axios';

class BatchService {
  // Create batch
  createBatch(batchData) {
    return axiosInstance.post('/batches', batchData);
  }

  // Get all batches
  getAllBatches() {
    return axiosInstance.get('/batches');
  }

  // Get batch by ID
  getBatchById(id) {
    return axiosInstance.get(`/batches/${id}`);
  }

  // Start batch (assign to employee)
  startBatch(batchId, startData) {
    return axiosInstance.patch(`/batches/${batchId}/start`, startData);
  }

  // Complete batch
  completeBatch(batchId, completeData) {
    return axiosInstance.patch(`/batches/${batchId}/complete`, completeData);
  }

  // Cancel batch
  cancelBatch(batchId, reason) {
    return axiosInstance.patch(`/batches/${batchId}/cancel`, null, {
      params: { reason }
    });
  }

  // Update batch
  updateBatch(batchId, updateData) {
    return axiosInstance.put(`/batches/${batchId}`, updateData);
  }

  // Get batches by status
  getBatchesByStatus(status) {
    return axiosInstance.get(`/batches/status/${status}`);
  }

  // Get batches by employee
  getBatchesByEmployee(employeeId) {
    return axiosInstance.get(`/batches/employee/${employeeId}`);
  }

  // Get delayed batches
  getDelayedBatches() {
    return axiosInstance.get('/batches/delayed');
  }

  // Get in-progress batches
  getInProgressBatches() {
    return axiosInstance.get('/batches/in-progress');
  }

  // Get dashboard data
  getDashboard() {
    return axiosInstance.get('/batches/dashboard');
  }

  // Get available employees
  getAvailableEmployees() {
    return axiosInstance.get('/batches/employees/available');
  }

  // Pre-check stock before creating batch
  preCheckStock(productId, batchQuantity) {
    return axiosInstance.post('/batches/pre-check', null, {
      params: { productId, batchQuantity }
    });
  }

  // Get stock check for product
  checkStockForProduct(productId, quantity) {
    return axiosInstance.get('/batches/stock-check', {
      params: { productId, quantity }
    });
  }

  // Search batches
  searchBatches(params) {
    return axiosInstance.get('/batches/search', { params });
  }
}

export default new BatchService();