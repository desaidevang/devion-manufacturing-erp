// src/services/warehouseLocationService.js
import axiosInstance from '../api/axios';

class WarehouseLocationService {
  // Create location
  createLocation(locationData) {
    return axiosInstance.post('/warehouse/locations', locationData);
  }

  // Get all locations
  getAllLocations() {
    return axiosInstance.get('/warehouse/locations');
  }

  // Get active locations
  getActiveLocations() {
    return axiosInstance.get('/warehouse/locations/active');
  }

  // Get available locations
  getAvailableLocations() {
    return axiosInstance.get('/warehouse/locations/available');
  }

  // Get location by ID
  getLocationById(id) {
    return axiosInstance.get(`/warehouse/locations/${id}`);
  }

  // Get location by code
  getLocationByCode(locationCode) {
    return axiosInstance.get(`/warehouse/locations/code/${locationCode}`);
  }

  // Update location
  updateLocation(id, updateData) {
    return axiosInstance.put(`/warehouse/locations/${id}`, updateData);
  }

  // Delete location
  deleteLocation(id) {
    return axiosInstance.delete(`/warehouse/locations/${id}`);
  }

  // Search locations
  searchLocations(searchTerm) {
    return axiosInstance.get('/warehouse/locations/search', {
      params: { searchTerm }
    });
  }

  // NEW METHOD: Get location with stock details
  getLocationWithStockDetails(locationId) {
    return axiosInstance.get(`/warehouse/locations/${locationId}/with-stock`);
  }
}

export default new WarehouseLocationService();