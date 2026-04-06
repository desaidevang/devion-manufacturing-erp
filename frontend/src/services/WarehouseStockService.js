// src/services/WarehouseStockService.js
import axiosInstance from '../api/axios';

class WarehouseStockService {
  // Get all stocks
  getAllStocks() {
    return axiosInstance.get('/warehouse/stocks');
  }

  // Get stock by ID
  getStockById(id) {
    return axiosInstance.get(`/warehouse/stocks/${id}`);
  }

  // Get stocks by part
  getStocksByPart(partId) {
    return axiosInstance.get(`/warehouse/stocks/part/${partId}`);
  }

  // Get stocks by location
  getStocksByLocation(locationId) {
    return axiosInstance.get(`/warehouse/stocks/location/${locationId}`);
  }

  // Get low stock items
  getLowStockItems() {
    return axiosInstance.get('/warehouse/stocks/low-stock');
  }

  // Create stock
  createStock(stockData) {
    return axiosInstance.post('/warehouse/stocks', stockData);
  }

  // Move stock
  moveStock(movementData) {
    return axiosInstance.post('/warehouse/stocks/move', movementData);
  }

  // Get total stock by part
  getTotalStockByPart(partId) {
    return axiosInstance.get(`/warehouse/stocks/part/${partId}/total`);
  }

  // Get available stock by part
  getAvailableStockByPart(partId) {
    return axiosInstance.get(`/warehouse/stocks/part/${partId}/available`);
  }

  // NEW: Get location stock details
  getLocationStockDetails(locationId) {
    return axiosInstance.get(`/warehouse/stocks/location/${locationId}/details`);
  }

  // NEW: Get location stock details by code
  getLocationStockDetailsByCode(locationCode) {
    return axiosInstance.get(`/warehouse/stocks/location/code/${locationCode}/details`);
  }

  // NEW: Get movement history
  getMovementHistory(params) {
    return axiosInstance.get('/warehouse/stocks/movement/history', { params });
  }

  // NEW: Get expiring soon items
  getExpiringSoonItems() {
    return axiosInstance.get('/warehouse/stocks/expiring-soon');
  }
}

export default new WarehouseStockService();