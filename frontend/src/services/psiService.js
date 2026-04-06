// src/services/psiService.js
import axiosInstance from '../api/axios';

class PSIService {
  // Create new PSI
  createPSI(psiData) {
    return axiosInstance.post('/psi', psiData); // Add /api/
  }

  // Get all PSI records
  getAllPSI() {
    return axiosInstance.get('/psi'); // Add /api/
  }

  // Get active PSI records
  getActivePSI() {
    return axiosInstance.get('/psi/active'); // Add /api/
  }

  // Get PSI by ID
  getPSIById(id) {
    return axiosInstance.get(`/psi/${id}`); // Add /api/
  }

  // Update PSI
  updatePSI(id, psiData) {
    return axiosInstance.put(`/psi/${id}`, psiData); // Add /api/
  }

  // Deactivate PSI
  deactivatePSI(id) {
    return axiosInstance.patch(`/psi/${id}/deactivate`); // Add /api/
  }
}

export default new PSIService();