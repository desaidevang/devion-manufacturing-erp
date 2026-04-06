// src/services/partService.js
import axiosInstance from '../api/axios';

class PartService {
  createPart(partData) {
    return axiosInstance.post('/parts', partData);
  }

  getAllParts() {
    return axiosInstance.get('/parts');
  }

  getActiveParts() {
    return axiosInstance.get('/parts/active');
  }

  getPartById(id) {
    return axiosInstance.get(`/parts/${id}`);
  }

  getPartByNumber(partNumber) {
    return axiosInstance.get(`/parts/number/${partNumber}`);
  }

  updatePart(id, partData) {
    return axiosInstance.put(`/parts/${id}`, partData);
  }

  linkPsiStandards(partId, psiStandardIds) {
    return axiosInstance.post(`/parts/${partId}/link-psi`, psiStandardIds);
  }

  removePsiStandard(partId, psiId) {
    return axiosInstance.delete(`/parts/${partId}/remove-psi/${psiId}`);
  }

  deactivatePart(id) {
    return axiosInstance.patch(`/parts/${id}/deactivate`);
  }
}

export default new PartService();
